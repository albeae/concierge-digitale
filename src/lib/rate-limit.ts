/**
 * Rate limiting "leggero" in-memory per le server action pubbliche (oggi:
 * solo il feedback ospite). Vive nella memoria del processo Node del
 * deployment serverless: NON è condiviso tra istanze diverse e si azzera a
 * ogni cold start. Per la scala di questo pilota (poche strutture, un
 * modulo feedback) è una difesa sufficiente contro script di spam banali;
 * non è un rate limiter distribuito e non deve essere trattato come tale
 * se il traffico crescesse molto (in quel caso: Upstash/Redis).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Evita una crescita indefinita della Map su un'istanza che resta calda a
// lungo: una spazzata occasionale basta, non serve un timer dedicato.
function sweepExpired(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** true = richiesta da bloccare (limite superato per questa finestra). */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
