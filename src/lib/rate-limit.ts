/**
 * Rate limiting "leggero" in-memory per le server action pubbliche (oggi:
 * solo il feedback ospite). Vive nella memoria del processo Node del
 * deployment serverless: NON è condiviso tra istanze diverse e si azzera a
 * ogni cold start. Per la scala di questo pilota (poche strutture, un
 * modulo feedback) è una difesa sufficiente contro script di spam banali;
 * NON è un rate limiter distribuito e NON basta da solo contro un abuso
 * distribuito su molti IP: quello va fermato al margine della rete (WAF /
 * rate limit di Vercel), prima ancora che la funzione parta. Vedi la nota
 * nel CLAUDE.md (review Codex #2): questo modulo è la seconda barriera.
 *
 * Memoria limitata + CPU limitata (LRU su Map):
 *  - un attacco con tanti IP DISTINTI riempirebbe la Map di bucket ancora
 *    "vivi": senza tetto crescerebbe all'infinito (DoS di memoria);
 *  - ordinare tutti i bucket a ogni saturazione per sfrattare i più vecchi
 *    sarebbe O(n log n) ripetuto durante un flood (DoS di CPU).
 * Soluzione: la `Map` di JS conserva l'ordine di inserimento; a ogni accesso
 * spostiamo il bucket in coda (delete+set = O(1)), così l'ordine diventa
 * "meno usato di recente → in testa". Al tetto `MAX_BUCKETS` sfrattiamo un
 * blocco dalla testa in O(batch), senza alcun sort. Vantaggio extra: il
 * contatore per-struttura, toccato a OGNI invio, resta sempre in coda e non
 * viene mai sfrattato — è quello che protegge i costi, il più importante da
 * tenere. Sotto sfratto cadono per primi i bucket per-IP mordi-e-fuggi.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// ~10k voci = pochi MB: abbondante per il pilota, ma un tetto reale contro
// una Map che cresce senza limiti durante un flood di IP distinti.
const MAX_BUCKETS = 10_000;

// Sposta una chiave in coda alla Map: diventa "usata di recente".
function touch(key: string, bucket: Bucket) {
  buckets.delete(key);
  buckets.set(key, bucket);
}

// Chiamata solo al tetto, prima di inserire una chiave nuova: sfratta un
// blocco dalla TESTA (i meno usati di recente) in O(batch), senza sort.
function evictLeastRecentlyUsed() {
  const batch = Math.max(1, Math.floor(MAX_BUCKETS / 10));
  const doomed: string[] = [];
  for (const key of buckets.keys()) {
    doomed.push(key);
    if (doomed.length >= batch) break;
  }
  for (const key of doomed) buckets.delete(key);
}

/** true = richiesta da bloccare (limite superato per questa finestra). */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt > now) {
    // Finestra ancora aperta: incrementa, tieni la chiave "calda" e verifica.
    bucket.count += 1;
    touch(key, bucket);
    return bucket.count > limit;
  }

  // Chiave nuova (o finestra scaduta): serve un bucket fresco. Se eravamo al
  // tetto liberiamo spazio prima di aggiungerlo.
  if (bucket) buckets.delete(key); // scaduto: via quello vecchio
  if (buckets.size >= MAX_BUCKETS) evictLeastRecentlyUsed();

  buckets.set(key, { count: 1, resetAt: now + windowMs });
  return false;
}

/** Solo per i test: azzera lo stato tra un caso e l'altro. */
export function __resetForTests() {
  buckets.clear();
}

/** Solo per i test: quante chiavi sono in memoria (per verificare il tetto). */
export function __bucketCountForTests(): number {
  return buckets.size;
}
