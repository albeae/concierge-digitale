/**
 * Test degli script SQL di supabase/ su PGlite (Postgres WASM, nessun Docker).
 *
 * Ricrea in locale un ambiente "tipo Supabase" (schema auth con auth.uid(),
 * ruoli anon/authenticated, schema storage con foldername()), esegue gli
 * script nell'ordine reale e verifica con assertion vincoli e policy RLS,
 * incluse le prove con `set role` e auth.uid() stubbato.
 *
 * Uso:  npm run test:sql   (esce con codice 1 se un'assertion fallisce)
 *
 * Nota: schema.sql e phase-3-auth.sql sono gli script storici già applicati
 * (non idempotenti, si eseguono una volta); i file nuovi devono invece essere
 * rieseguibili, quindi qui vengono eseguiti DUE volte.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = fileURLToPath(new URL("..", import.meta.url));
const sql = (name) => readFile(new URL(`../supabase/${name}`, import.meta.url), "utf8");

const db = new PGlite();
let failures = 0;

function ok(cond, label) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}`);
  }
}

/** Esegue fn aspettandosi un errore (vincolo o policy violati). */
async function expectError(label, fn) {
  try {
    await fn();
    ok(false, `${label} (nessun errore sollevato!)`);
  } catch {
    ok(true, label);
  } finally {
    // Se l'errore è scattato dentro un ruolo impostato, torna al superuser.
    await db.exec("reset role;");
  }
}

/** Esegue fn come `role`, con l'uid del JWT stubbato, poi torna superuser. */
async function asRole(role, uid, fn) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? ""]);
  await db.exec(`set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}

const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

// ---------------------------------------------------------------------------
// 1. Stub dell'ambiente Supabase: auth, ruoli, storage, grant di default.
// ---------------------------------------------------------------------------
console.log("Stub ambiente Supabase (auth, ruoli, storage)…");
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key);

  -- auth.uid() come su Supabase: legge il sub del JWT (qui stubbato via GUC).
  create or replace function auth.uid() returns uuid
    language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

  do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
  do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;

  grant usage on schema public to anon, authenticated;
  -- Su Supabase i ruoli API hanno usage anche su auth (serve per auth.uid()).
  grant usage on schema auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;

  -- Stub minimo dello schema storage di Supabase.
  create schema if not exists storage;
  create table if not exists storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text,
    owner uuid,
    created_at timestamptz not null default now()
  );
  create or replace function storage.foldername(name text) returns text[]
    language sql immutable
    as $$
      select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
    $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  grant select on storage.buckets to anon, authenticated;
`);

// ---------------------------------------------------------------------------
// 2. Script storici (già in produzione): una sola esecuzione.
// ---------------------------------------------------------------------------
console.log("Eseguo schema.sql e phase-3-auth.sql…");
await db.exec(await sql("schema.sql"));
await db.exec(await sql("phase-3-auth.sql"));

// Provisioning come da phase-3-auth.sql: utenti + owner di casa-rossa.
await db.query("insert into auth.users (id) values ($1), ($2)", [OWNER, OTHER]);
await db.query("update public.bnb_clients set owner_id = $1 where id = 'casa-rossa'", [OWNER]);

// ---------------------------------------------------------------------------
// 3. Script nuovi: DUE esecuzioni ciascuno (devono essere idempotenti).
// ---------------------------------------------------------------------------
for (const file of [
  "guest-feedback.sql",
  "storage-images.sql",
  "google-reviews.sql",
  "reorder-places.sql",
]) {
  console.log(`Eseguo ${file} (due volte, per l'idempotenza)…`);
  const text = await sql(file);
  await db.exec(text);
  await db.exec(text);
}

const policyCount = async (schema, table) =>
  Number(
    (
      await db.query(
        "select count(*)::int as n from pg_policies where schemaname = $1 and tablename = $2",
        [schema, table],
      )
    ).rows[0].n,
  );

console.log("\nAssertion su guest_feedback:");
ok((await policyCount("public", "guest_feedback")) === 3, "3 policy su guest_feedback, senza duplicati dopo la doppia esecuzione");

// Vincoli della tabella (eseguiti da anon: passa la policy, fermano i check).
await expectError("rating 4 rifiutato (i voti alti vanno su Google, non qui)", () =>
  asRole("anon", null, () =>
    db.query(
      "insert into public.guest_feedback (bnb_client_id, rating, message) values ('casa-rossa', 4, 'ciao')",
    ),
  ),
);
await expectError("rating 0 rifiutato", () =>
  asRole("anon", null, () =>
    db.query(
      "insert into public.guest_feedback (bnb_client_id, rating, message) values ('casa-rossa', 0, 'ciao')",
    ),
  ),
);
await expectError("messaggio vuoto rifiutato", () =>
  asRole("anon", null, () =>
    db.query(
      "insert into public.guest_feedback (bnb_client_id, rating, message) values ('casa-rossa', 2, '')",
    ),
  ),
);
await expectError("bnb inesistente rifiutato (FK)", () =>
  asRole("anon", null, () =>
    db.query(
      "insert into public.guest_feedback (bnb_client_id, rating, message) values ('non-esiste', 2, 'ciao')",
    ),
  ),
);

// Percorso felice dell'ospite: inserisce ma non rilegge.
await asRole("anon", null, () =>
  db.query(
    "insert into public.guest_feedback (bnb_client_id, rating, message) values ('casa-rossa', 2, 'Acqua calda intermittente')",
  ),
);
ok(true, "anon inserisce un feedback valido");

const anonRead = await asRole("anon", null, () =>
  db.query("select count(*)::int as n from public.guest_feedback"),
);
ok(anonRead.rows[0].n === 0, "anon NON rilegge i feedback (nessuna lettura pubblica)");

// Il titolare legge/elimina solo i propri; un altro utente non vede nulla.
const ownerRead = await asRole("authenticated", OWNER, () =>
  db.query("select count(*)::int as n from public.guest_feedback where bnb_client_id = 'casa-rossa'"),
);
ok(ownerRead.rows[0].n === 1, "il titolare legge i feedback della sua struttura");

const otherRead = await asRole("authenticated", OTHER, () =>
  db.query("select count(*)::int as n from public.guest_feedback"),
);
ok(otherRead.rows[0].n === 0, "un ALTRO titolare non vede quei feedback");

const otherDelete = await asRole("authenticated", OTHER, () =>
  db.query("delete from public.guest_feedback where bnb_client_id = 'casa-rossa'"),
);
ok(otherDelete.affectedRows === 0, "un ALTRO titolare non può eliminarli");

const ownerDelete = await asRole("authenticated", OWNER, () =>
  db.query("delete from public.guest_feedback where bnb_client_id = 'casa-rossa'"),
);
ok(ownerDelete.affectedRows === 1, "il titolare elimina i feedback della sua struttura");

console.log("\nAssertion su Storage (bucket bnb-images):");
const bucket = await db.query("select public, file_size_limit from storage.buckets where id = 'bnb-images'");
ok(bucket.rows.length === 1 && bucket.rows[0].public === true, "bucket bnb-images creato e pubblico");
ok(Number(bucket.rows[0].file_size_limit) === 5242880, "limite 5 MB impostato sul bucket");
ok((await policyCount("storage", "objects")) === 3, "3 policy su storage.objects, senza duplicati dopo la doppia esecuzione");

await asRole("authenticated", OWNER, () =>
  db.query("insert into storage.objects (bucket_id, name) values ('bnb-images', 'casa-rossa/logo.webp')"),
);
ok(true, "il titolare carica nella cartella della SUA struttura");

const ownerObjRead = await asRole("authenticated", OWNER, () =>
  db.query("select count(*)::int as n from storage.objects"),
);
ok(ownerObjRead.rows[0].n === 1, "il titolare vede le immagini della sua struttura");

const otherObjRead = await asRole("authenticated", OTHER, () =>
  db.query("select count(*)::int as n from storage.objects"),
);
ok(otherObjRead.rows[0].n === 0, "un ALTRO titolare non vede le immagini altrui");

await expectError("il titolare NON carica nella cartella di un'altra struttura", () =>
  asRole("authenticated", OWNER, () =>
    db.query("insert into storage.objects (bucket_id, name) values ('bnb-images', 'altra-struttura/x.webp')"),
  ),
);
await expectError("anon NON carica nulla", () =>
  asRole("anon", null, () =>
    db.query("insert into storage.objects (bucket_id, name) values ('bnb-images', 'casa-rossa/x.webp')"),
  ),
);

const otherObjDelete = await asRole("authenticated", OTHER, () =>
  db.query("delete from storage.objects where name = 'casa-rossa/logo.webp'"),
);
ok(otherObjDelete.affectedRows === 0, "un ALTRO titolare non elimina le immagini altrui");

const ownerObjDelete = await asRole("authenticated", OWNER, () =>
  db.query("delete from storage.objects where name = 'casa-rossa/logo.webp'"),
);
ok(ownerObjDelete.affectedRows === 1, "il titolare elimina le immagini della sua struttura");

console.log("\nAssertion su google_reviews_url:");
const grCol = await db.query(
  "select column_default, is_nullable from information_schema.columns where table_schema='public' and table_name='bnb_clients' and column_name='google_reviews_url'",
);
ok(grCol.rows.length === 1 && grCol.rows[0].is_nullable === "NO", "colonna google_reviews_url presente e NOT NULL");
const grSeed = await db.query("select google_reviews_url from public.bnb_clients where id = 'casa-rossa'");
ok(grSeed.rows[0].google_reviews_url === "", "Casa Rossa parte con link recensioni vuoto (default)");

console.log("\nAssertion su reorder_places (riordino atomico):");

// Gli id reali del seed di Casa Rossa (7 posti).
const PLACE_IDS = [
  "place-nonna-rosa",
  "place-forno-vicolo",
  "place-osteria-sisto",
  "place-gelateria-fonte",
  "place-enoteca-santa-maria",
  "place-farmacia-gallicano",
  "place-alimentari-marco",
];

const callReorder = (uid, ids) =>
  asRole("authenticated", uid, () =>
    db.query("select public.reorder_places('casa-rossa', $1::text[])", [ids]),
  );

const readOrder = async () =>
  (
    await db.query(
      "select id, sort_order from public.restaurants where bnb_client_id = 'casa-rossa' order by sort_order",
    )
  ).rows;

// Permutazione valida: inverto l'ordine → sort_order deve diventare 0..n-1.
const reversed = [...PLACE_IDS].reverse();
await callReorder(OWNER, reversed);
const afterReverse = await readOrder();
ok(
  afterReverse.length === 7 &&
    afterReverse.every((r, i) => r.id === reversed[i] && Number(r.sort_order) === i),
  "permutazione valida: sort_order = posizione 0..n-1 nell'ordine richiesto",
);

// Lista PARZIALE (manca un id): rifiutata, e l'ordine NON cambia (atomicità).
await expectError("lista parziale rifiutata", () => callReorder(OWNER, reversed.slice(0, 6)));
const afterPartial = await readOrder();
ok(
  afterPartial.every((r, i) => r.id === reversed[i] && Number(r.sort_order) === i),
  "dopo una lista parziale l'ordine resta invariato (nessuna scrittura parziale)",
);

// Lista con id DUPLICATO: rifiutata.
const withDup = [...reversed];
withDup[1] = withDup[0];
await expectError("lista con id duplicato rifiutata", () => callReorder(OWNER, withDup));

// Lista con un id ESTRANEO (non della struttura): rifiutata.
const withForeign = [...reversed];
withForeign[0] = "place-non-esiste";
await expectError("lista con id estraneo rifiutata", () => callReorder(OWNER, withForeign));

// Un ALTRO titolare non può riordinare i posti altrui (controllo proprietà).
await expectError("un ALTRO titolare non riordina i posti altrui", () =>
  callReorder(OTHER, reversed),
);

// Dopo tutti i tentativi falliti l'ordine è ancora quello dell'unico valido.
const finalOrder = await readOrder();
ok(
  finalOrder.every((r, i) => r.id === reversed[i] && Number(r.sort_order) === i),
  "dopo i tentativi falliti l'ordine è ancora l'ultimo valido (nessun effetto parziale)",
);

// ---------------------------------------------------------------------------
console.log("");
if (failures > 0) {
  console.error(`${failures} assertion fallite (root: ${root})`);
  process.exit(1);
}
console.log("Tutte le assertion sono passate ✓");
