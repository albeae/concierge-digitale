/**
 * Test unitario del rate limiter in-memory (`src/lib/rate-limit.ts`).
 *
 * Non serve né rete né Supabase: verifica solo la logica del contatore a
 * finestra fissa — limite, scadenza, indipendenza delle chiavi e il tetto
 * di memoria contro un flood di IP distinti. Gira in CI insieme a test:sql.
 *
 * Node esegue direttamente il .ts (type stripping): niente build step.
 *
 * Uso:  npm run test:unit   (esce con codice 1 se un'assertion fallisce)
 */
import {
  isRateLimited,
  __resetForTests,
  __bucketCountForTests,
} from "../src/lib/rate-limit.ts";

const MAX_BUCKETS = 10_000;

let failures = 0;

function ok(cond, label) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("\nAssertion sul rate limiter:");

// 1. Limite per finestra: con limite 5, le prime 5 passano, dalla 6ª blocca.
__resetForTests();
{
  const results = [];
  for (let i = 0; i < 7; i++) {
    results.push(isRateLimited("ip:1.2.3.4:casa-rossa", 5, 10 * 60 * 1000));
  }
  const allowed = results.filter((r) => !r).length;
  const blocked = results.filter((r) => r).length;
  ok(allowed === 5 && blocked === 2, `5 passano, dalla 6ª bloccate (allowed=${allowed}, blocked=${blocked})`);
}

// 2. Chiavi diverse non condividono il bucket (IP diverso = conteggio suo).
__resetForTests();
{
  for (let i = 0; i < 5; i++) isRateLimited("ip:1.1.1.1:casa-rossa", 5, 10 * 60 * 1000);
  const other = isRateLimited("ip:2.2.2.2:casa-rossa", 5, 10 * 60 * 1000);
  ok(other === false, "un IP saturo non blocca un IP diverso");
}

// 3. La finestra scade: dopo `windowMs` il contatore riparte da zero.
__resetForTests();
{
  ok(isRateLimited("short", 2, 40) === false, "1ª nella finestra breve passa");
  ok(isRateLimited("short", 2, 40) === false, "2ª passa (al limite)");
  ok(isRateLimited("short", 2, 40) === true, "3ª bloccata dentro la finestra");
  await sleep(70);
  ok(isRateLimited("short", 2, 40) === false, "dopo la scadenza il contatore riparte");
}

// 4. Tetto di memoria: un flood di chiavi DISTINTE non fa crescere la Map
//    all'infinito. Inseriamo molte più chiavi del tetto e verifichiamo
//    ESPLICITAMENTE che la size resti sotto MAX (senza il tetto sarebbe 20k).
__resetForTests();
{
  for (let i = 0; i < 20_000; i++) {
    isRateLimited(`flood:${i}`, 5, 60 * 60 * 1000);
  }
  const size = __bucketCountForTests();
  ok(size <= MAX_BUCKETS, `la Map resta sotto il tetto dopo 20k chiavi (size=${size} ≤ ${MAX_BUCKETS})`);

  const t0 = Date.now();
  let allowed = 0;
  for (let i = 0; i < 7; i++) {
    if (!isRateLimited("caldo:dopo-flood", 5, 60 * 60 * 1000)) allowed++;
  }
  const elapsed = Date.now() - t0;
  ok(allowed === 5, `dopo il flood il limite tiene ancora (allowed=${allowed})`);
  ok(elapsed < 1000, `nessun degrado patologico dopo il flood (${elapsed}ms)`);
}

// 5. LRU: una chiave toccata di continuo NON viene sfrattata da un flood di
//    chiavi nuove (è il caso del contatore per-struttura, che protegge i
//    costi ed è toccato a ogni invio). La creiamo, poi la teniamo "calda"
//    durante il flood, infine verifichiamo che il suo conteggio sia intatto.
__resetForTests();
{
  // Riempi con 15 sul contatore "struttura" (limite alto per non bloccarlo).
  for (let i = 0; i < 15; i++) isRateLimited("bnb:casa-rossa", 1000, 60 * 60 * 1000);
  // Flood di chiavi nuove, ritoccando la chiave calda ogni tanto.
  for (let i = 0; i < 20_000; i++) {
    isRateLimited(`flood2:${i}`, 5, 60 * 60 * 1000);
    if (i % 500 === 0) isRateLimited("bnb:casa-rossa", 1000, 60 * 60 * 1000);
  }
  // Se fosse stata sfrattata, il conteggio ripartirebbe da 1 e non supererebbe
  // mai un limite basso; qui invece deve aver accumulato (>15) senza reset.
  const blocked = isRateLimited("bnb:casa-rossa", 20, 60 * 60 * 1000);
  ok(blocked === true, "la chiave calda sopravvive al flood (contatore non azzerato dallo sfratto)");
}

if (failures > 0) {
  console.error(`\n${failures} assertion fallite ✗`);
  process.exit(1);
}
console.log("\nTutte le assertion sono passate ✓");
