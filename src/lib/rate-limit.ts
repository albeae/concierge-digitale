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
 * Difesa contro l'esaurimento memoria: un attacco con tanti IP DISTINTI nella
 * stessa finestra riempirebbe la Map di bucket ancora "vivi" (non scaduti),
 * che la sola pulizia degli scaduti non toglierebbe. Perciò c'è un tetto
 * rigido `MAX_BUCKETS`: superato quello, si sfrattano i bucket più vicini a
 * scadere (perdono meno informazione e sono tipicamente quelli per-IP a
 * finestra breve, non il contatore per-struttura a finestra lunga che
 * protegge i costi). Così la memoria resta limitata comunque vada.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// ~10k voci = pochi MB: abbondante per il pilota, ma un tetto reale contro
// una Map che cresce senza limiti durante un flood di IP distinti.
const MAX_BUCKETS = 10_000;

function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// Chiamata solo quando siamo al tetto e stiamo per inserire una chiave nuova:
// libera spazio sfrattando i bucket più vicini alla scadenza.
function evictOldest() {
  const soonestFirst = [...buckets.entries()].sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );
  const toRemove = Math.max(1, Math.floor(MAX_BUCKETS / 10));
  for (let i = 0; i < toRemove && i < soonestFirst.length; i++) {
    buckets.delete(soonestFirst[i][0]);
  }
}

/** true = richiesta da bloccare (limite superato per questa finestra). */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt > now) {
    // Finestra ancora aperta per questa chiave: incrementa e verifica.
    bucket.count += 1;
    return bucket.count > limit;
  }

  // Chiave nuova (o finestra scaduta): serve un bucket fresco. Prima di
  // aggiungerlo teniamo la Map sotto controllo.
  if (buckets.size >= MAX_BUCKETS) {
    sweepExpired(now);
    if (buckets.size >= MAX_BUCKETS) evictOldest();
  }

  buckets.set(key, { count: 1, resetAt: now + windowMs });
  return false;
}

/** Solo per i test: azzera lo stato tra un caso e l'altro. */
export function __resetForTests() {
  buckets.clear();
}
