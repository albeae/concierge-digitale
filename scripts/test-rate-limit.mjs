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
import { isRateLimited, __resetForTests } from "../src/lib/rate-limit.ts";

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
//    all'infinito. Inseriamo molte più chiavi del tetto e controlliamo che
//    una chiave "calda" continui comunque a funzionare (il limite tiene).
__resetForTests();
{
  // 20k chiavi distinte, tutte a finestra lunga (nessuna scade durante il test):
  // se non ci fosse il tetto, la Map crescerebbe fino a 20k voci.
  for (let i = 0; i < 20_000; i++) {
    isRateLimited(`flood:${i}`, 5, 60 * 60 * 1000);
  }
  // Il modulo non espone la size, ma un flood senza tetto sarebbe ~20k voci
  // (diversi MB) e degraderebbe l'ordinamento allo sfratto; qui verifichiamo
  // il comportamento osservabile: una chiave nuova continua a rispettare il
  // limite senza errori né rallentamenti patologici.
  const t0 = Date.now();
  let allowed = 0;
  for (let i = 0; i < 7; i++) {
    if (!isRateLimited("caldo:dopo-flood", 5, 60 * 60 * 1000)) allowed++;
  }
  const elapsed = Date.now() - t0;
  ok(allowed === 5, `dopo il flood il limite tiene ancora (allowed=${allowed})`);
  ok(elapsed < 1000, `nessun degrado patologico dopo il flood (${elapsed}ms)`);
}

if (failures > 0) {
  console.error(`\n${failures} assertion fallite ✗`);
  process.exit(1);
}
console.log("\nTutte le assertion sono passate ✓");
