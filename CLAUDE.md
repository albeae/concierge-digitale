@AGENTS.md

# Concierge Digitale — Manuale operativo

Micro SaaS per B&B/affittacamere di Roma: l'ospite scansiona un QR e apre la guida della struttura (Wi-Fi, regole, trasporti, posti consigliati); il titolare gestisce i contenuti da un pannello protetto. PWA mobile-first, dati su Supabase, deploy su Vercel (`concierge-digitale.vercel.app`, repo GitHub `albeae/concierge-digitale`, deploy automatico a ogni push su `main` — **`main` è produzione**).

**Chi è l'utente**: il proprietario del progetto non è un programmatore. Spiega le scelte in italiano semplice, senza gergo non necessario; esegui e verifica tu invece di chiedere a lui di farlo; quando serve un passo manuale (es. SQL su Supabase), scrivi istruzioni passo-passo a fine risposta.

---

## 1. Mappa del progetto

| Percorso | Responsabilità |
|---|---|
| `src/app/[bnbId]/page.tsx` | Pagina ospite (server component, ISR 300s, `generateStaticParams` dal DB) |
| `src/app/page.tsx` | Root: redirect al primo B&B (ISR 300s; 404 se DB vuoto) |
| `src/app/admin/**` | Area titolare: login, dashboard, editor (`force-dynamic`, `robots: noindex`) |
| `src/app/admin/actions.ts` | Server action `login`/`logout` |
| `src/app/admin/[bnbId]/actions.ts` | Server action di scrittura (dati generali, contenuti, posti) |
| `src/proxy.ts` | "Middleware" di Next 16 (si chiama proxy): refresh sessione + redirect, solo `/admin/:path*` |
| `src/lib/supabase.ts` | Client **anon puro** — SOLO pagine ospite (lettura) |
| `src/lib/supabase-server.ts` | Client **server con cookie** — SOLO area admin (sessione titolare) |
| `src/lib/data.ts` | Data layer pubblico: `getBnb` / `getBnbIds` / `getPlaces` (async, `cache()`) |
| `src/lib/auth.ts` | DAL admin: `getSessionUser`, `requireUser`, `getOwnedBnb(s)`, `getOwnedBnbPlaces` |
| `src/lib/bnb-mappers.ts` | UNICO punto di mappatura righe DB (snake_case) ↔ tipi dominio (camelCase) + elenchi colonne |
| `src/lib/localize.ts` | Fallback lingua per-chiave su `en` — **non modificare la logica** |
| `src/lib/i18n.ts` | Etichette UI fisse in it/en/es (`UiStrings`) |
| `src/lib/contacts.ts` | Solo il 112 e gli helper `telUrl`/`whatsappUrl` (i contatti host vivono nel DB) |
| `src/lib/brand.ts` / `recycling.ts` | Costanti: colori chrome PWA / colori cestini AMA (whitelist hex) |
| `src/types/index.ts` | Tipi di dominio (`Bnb`, `Place`, `Localized<T>`, `BnbTheme`, …) |
| `src/components/*.tsx` | UI ospite (BnbGuide + tab Home/Esplora/Info) |
| `src/components/admin/*.tsx` | UI pannello (form, editor colori con anteprima live, picker) |
| `src/components/theme-provider.tsx` | Inietta il tema del B&B come CSS variables |
| `supabase/schema.sql` | Fase 2: tabelle + RLS lettura + seed (applicato ✅) |
| `supabase/phase-3-auth.sql` | Fase 3: policy di scrittura titolare (applicato ✅) |
| `public/sw.js`, `src/app/manifest.ts` | PWA: service worker (solo produzione) + manifest |

---

## 2. Architettura dati (i due binari)

**Binario ospite (pubblico, statico):** `page.tsx` → `data.ts` → `supabase.ts` (anon) → RLS `select using (true)`. Le pagine sono statiche con `revalidate = 300`: restano su CDN e si rigenerano al massimo ogni 5 minuti. Su errore DB il data layer logga e restituisce vuoto → `notFound()`; la build non fallisce mai per un DB vuoto.

**Binario titolare (protetto, dinamico):** richiesta → `proxy.ts` (refresh sessione + redirect) → pagina admin `force-dynamic` → `auth.ts` (`requireUser` + filtro `owner_id`) → server action → `supabase-server.ts` (JWT nei cookie) → RLS `auth.uid() = owner_id` → `revalidatePath('/[bnbId]')`.

**Tre livelli di difesa, sempre tutti e tre:** proxy (ottimistico) + `requireUser`/`getOwnedBnb` nelle pagine e azioni + RLS nel DB. Nessuno dei tre da solo è sufficiente.

**Schema DB** (dettagli e commenti in `supabase/schema.sql`):
- `bnb_clients`: `id` = slug URL (testo), `owner_id` uuid nullable → `auth.users` (non univoco: un titolare, più strutture), `theme`/`toggles`/`content`/`location` jsonb, `address`, `host_phone`, `host_whatsapp`, `created_at`. Wi-Fi/regole/trasporti vivono DENTRO i jsonb: niente tabelle nuove senza necessità reale.
- `restaurants`: FK `bnb_client_id` (cascade), `category` con check (`ristorante|bar|servizio`), `name`/`description` jsonb localizzati, `walking_distance`, `image_url`, `google_maps_url`, `sort_order` (l'ordine lista è SEMPRE esplicito, mai affidato al DB).
- La **anon key è l'unica chiave disponibile**: il codice non può fare DDL. Ogni modifica di schema = nuovo file `supabase/*.sql` che l'utente esegue a mano nell'SQL Editor.

---

## 3. Convenzioni del repo

**Lingua.** Codice, commenti, commit, testi admin: italiano. Contenuti ospite: it/en/es con `en` base obbligatoria. Termini tecnici in inglese dove naturale.

**Commit.** Conventional in italiano con la fase: `feat(fase-3): …`, `fix(fase-3): …`, `docs: …`. Commit logici separati (SQL / codice / docs). Chiudi con `Co-Authored-By: Claude <modello> <noreply@anthropic.com>`. Branch per fase (`fase-N-nome`); **mai push senza che l'utente lo chieda** (`main` = produzione).

**Colori e token.** Nessun colore/ombra/raggio scritto a mano nei componenti: solo utility Tailwind mappate su CSS variables (`bg-terracotta`, `text-primary-foreground`, `shadow-soft`, `rounded-2xl`…). Il tema per-struttura è iniettato da `ThemeProvider` in tre famiglie: identità (`--primary`/`--terracotta`/`--terracotta-strong`/`--ring`, `--ochre`), sfondi (`--background`, `--card`/`--popover`, `--secondary`/`--accent`), testo (`--foreground`/`--card-foreground`/`--popover-foreground`, `--muted-foreground`, `--primary-foreground`). I 5 colori opzionali (`primaryForeground`, `textColor`, `mutedColor`, `cardColor`, `sectionColor`) se assenti non sovrascrivono nulla. Whitelist hex: `brand.ts`, `recycling.ts`, `DEFAULTS` in `theme-colors.tsx` (default calcolati per conversione da oklch, non a occhio).

**Localizzazione.** `Localized<T> = { en: T } & Partial<Record<Locale, T>>`. `en` è sempre presente ed è la base; il fallback è per-chiave (`resolveLocalized`) o per-testo (`pick`). Nel salvataggio: `en` sempre scritto, `it`/`es` omessi se completamente vuoti. Aggiungere una lingua = 1 valore in `Locale` + 1 blocco in `ui` (`i18n.ts`) + contenuti nel DB.

**Dati.** Tipi di dominio camelCase; righe DB snake_case; conversione ed elenchi colonne SOLO in `bnb-mappers.ts`. Query pubbliche in `data.ts` (avvolte in `cache()` di React), query admin in `auth.ts`.

**Scritture.** Solo da server action admin, sempre con questo schema in quest'ordine: (1) `getOwnedBnb(bnbId)` → errore se null; (2) normalizzazione input (`str()`, validazioni, niente fiducia nel client); (3) scrittura col client server; (4) `revalidatePath`. Stato di ritorno `ActionState` (`{ok:true,message}` / `{ok:false,error}`) con messaggi in italiano comprensibili a un non tecnico.

**SQL.** Un file per fase in `supabase/`, rieseguibile senza danni (`on conflict do nothing`, solo `create policy` additive…), dollar-quoting per i jsonb, commenti che spiegano il perché. Prima del commit va **eseguito davvero** su PGlite (Postgres WASM, `npm i @electric-sql/pglite` nello scratchpad) con stub Supabase: `create schema auth; create table auth.users (id uuid primary key); create role anon; create role authenticated;` — poi assertion su vincoli, policy e, per le policy di scrittura, prove con `set role` / `auth.uid()` stubbato.

**UI.** Mobile-first (l'ospite è al telefono): tap target grandi, card `rounded-3xl`, ombre morbide dai token. Rendering condizionale (non nascondere via CSS). `min-h-*` sui contenitori di testo, mai altezze fisse. Emoji come icone di dominio (regole, trasporti), lucide per la UI.

---

## 4. Errori tipici (nome → regola che li previene)

1. **Il Next.js che ricordi non è questo.** Next 16 ha breaking changes: il middleware si chiama `src/proxy.ts` (export `proxy`), `params` è una `Promise` (sempre `await params`), niente `cacheComponents` (vale il modello ISR classico). Regola: se un'API Next non compare già nel repo, leggi prima la doc locale in `node_modules/next/dist/docs/`.
2. **Il colore scritto a mano.** Un hex nel markup rompe il theming per-struttura. Regola: ogni colore passa da un token; se il token non esiste, aggiungilo in `globals.css` + `ThemeProvider` + (se il titolare deve poterlo cambiare) selettore in `theme-colors.tsx`. Eccezioni: solo la whitelist della sezione 3.
3. **Il bianco che sparisce.** `text-white`/`bg-white` diventa illeggibile con temi chiari; testo `--foreground` su sfondi scuri sparisce. Regola: usa sempre coppie accoppiate (`bg-X` + `text-X-foreground`); i pulsanti outline della guest usano bordo+testo `terracotta`, MAI il variant `outline` nudo (eredita colori di pagina). Unica eccezione `text-white`: le icone dei cestini AMA.
4. **La lingua riempita di vuoti.** Salvare `it: ""` uccide il fallback (l'ospite vede campi vuoti invece dell'inglese). Regola: `en` sempre completo; `it`/`es` si omettono del tutto se vuoti; `localize.ts` non si tocca.
5. **Il client mescolato.** Se una pagina ospite importa `supabase-server.ts` (o `next/headers`) diventa dinamica e perde ISR/CDN. Regola: guest → `supabase.ts`; admin → `supabase-server.ts`. Mai incrociarli.
6. **La scrittura dal posto sbagliato.** Il client anon non può scrivere (RLS) e non deve provarci. Regola: ogni scrittura è una server action admin con i 4 passi della sezione 3 (ownership → normalizza → scrivi → revalida).
7. **Il DDL impossibile.** `create table` via API fallisce in silenzio concettuale: c'è solo la anon key. Regola: modifiche di schema = nuovo file `supabase/*.sql` + istruzioni manuali per l'utente + validazione PGlite.
8. **La difesa unica.** "Tanto c'è il proxy" (o "tanto c'è la RLS") è come si creano i buchi. Regola: tutti e tre i livelli, sempre; ogni nuova pagina/azione admin chiama `requireUser`/`getOwnedBnb` anche se il proxy già filtra.
9. **La modifica che non si vede.** Senza `revalidatePath` la pagina ospite resta cache-ata fino a 5 minuti e il titolare crede che il salvataggio sia rotto. Regola: ogni scrittura termina con `refreshGuest(bnbId)`.
10. **Il 500 evitabile.** Un DB vuoto/spento non è un'eccezione: è lo stato normale prima dell'apply SQL. Regola: nel data layer pubblico ogni errore → `console.error` + ritorno vuoto → la pagina fa `notFound()`; `getBnbIds()` che fallisce restituisce `[]` e la build passa.
11. **Lo snake nel dominio.** `host_phone` che gira nei componenti = refactoring doloroso. Regola: la conversione avviene una volta sola in `bnb-mappers.ts`; i componenti vedono solo camelCase.
12. **L'altezza che taglia.** `h-5` fisso + `overflow-hidden` su un badge taglia il testo in verticale (successo davvero). Regola: `min-h-*` sui contenitori di testo; niente `overflow-hidden` dove il contenuto può crescere.
13. **Verificato a occhio.** Uno screenshot non dimostra un colore né un'altezza. Regola: verifica con misure — `preview_inspect`/`getComputedStyle`, status HTTP, `scrollHeight === clientHeight` — e riporta i valori. I default hex derivati dalla palette oklch si calcolano con la conversione matematica.
14. **Il segreto nel repo.** Regola: mai credenziali/chiavi nei file versionati (`.env*` è gitignorato); le credenziali di test admin le fornisce l'utente in sessione, non scriverle in CLAUDE.md o nei commit.
15. **La porta dell'utente.** La 3000 spesso è occupata dal `npm run dev` dell'utente che sta testando. Regola: mai uccidere processi non tuoi; usa il preview (launch.json ha `autoPort`) e se non parte, dillo e vai avanti con verifiche non-browser.
16. **La fase saltata.** Il principio del progetto è "parti piccolo, poi generalizza". Regola: non anticipare infrastruttura delle fasi future (multi-tenant self-service, pagamenti) se non richiesto; una fase alla volta, testata.

---

## 5. Quality bar (criteri verificabili, non aggettivi)

Prima di dichiarare finito un lavoro, TUTTI questi devono passare:

- [ ] `npx tsc --noEmit` → exit 0.
- [ ] `npm run lint` → exit 0, zero warning.
- [ ] `npm run build` → exit 0 **e** nel riepilogo route: `/` e `/[bnbId]` statiche (○/●) con `Revalidate: 5m`; le route `/admin*` dinamiche (ƒ); riga `Proxy (Middleware)` presente.
- [ ] `grep -rn -E "#[0-9a-fA-F]{6}" src/components src/app --include="*.tsx"` → risultati solo nei file whitelist (`theme-colors.tsx`); `grep -rn "text-white\|bg-white" src/components` → solo `rules-card.tsx` (cestini).
- [ ] Ogni server action di scrittura contiene sia `getOwnedBnb(` sia `refreshGuest(`/`revalidatePath(`.
- [ ] SQL nuovo: eseguito su PGlite con stub auth/ruoli; tutte le assertion stampano ✓; rieseguirlo due volte non genera errori né duplicati.
- [ ] Se il DB è irraggiungibile o vuoto: `/` e `/casa-rossa` rispondono **404** (mai 500) e la build completa comunque.
- [ ] UI toccata: verificata nel preview a viewport mobile (375px) con almeno una misura oggettiva (computed style, conteggio elementi, status); niente scroll orizzontale (`document.documentElement.scrollWidth <= window.innerWidth`).
- [ ] i18n toccata: con lingua ES su un campo senza traduzione si vede il testo EN, mai stringa vuota.
- [ ] Admin toccato: login reale nel preview (credenziali dall'utente), salvataggio eseguito e dato riletto che corrisponde; ripristinato l'eventuale valore di test prima di chiudere.
- [ ] `git status --short` vuoto a fine lavoro; messaggi commit conformi alla sezione 3.
- [ ] Se lo stato di una fase è cambiato: sezione 7 di questo file aggiornata nello stesso giro di commit.

---

## 6. Flusso di lavoro

1. **Branch per fase**, nomi `fase-N-descrizione`. Lavoro corrente committato lì; l'utente rivede e mergia lui.
2. **Ordine dei commit**: prima l'SQL (se c'è), poi il codice, poi i docs — ognuno autonomo e con build verde.
3. **Verifica end-to-end quando possibile**: preview → login (se serve, chiedi le credenziali) → azione reale → misura → eventuale ripristino. Quando il preview non può partire, dichiara cosa NON hai potuto verificare.
4. **Passi manuali**: qualsiasi cosa l'utente debba fare a mano (SQL Editor, pannello Supabase, merge) va elencata a fine risposta, numerata, con i comandi/SQL pronti da incollare.
5. **Documentazione**: CLAUDE.md è il registro operativo; aggiornalo quando cambiano architettura, convenzioni o stato fasi — non per ogni singolo fix.

---

## 7. Roadmap e stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | MVP statico singola property, PWA base, deploy Vercel | ✅ completata |
| 2 | Supabase: schema + RLS lettura + seed; frontend legge dal DB; ISR 300s | ✅ completata e applicata |
| 3 | Auth titolare + pannello admin + policy scrittura + editor tema completo | ✅ completata e applicata (login funzionante, `owner_id` collegato) |
| 4 | Multi-tenancy: landing/elenco su `/`, generazione QR per struttura | ⬜ prossima (il routing `/[slug]` esiste già) |
| 5 | PWA avanzata: già fatti manifest+SW in Fase 1; resta test offline reale su device | ◐ parziale |
| 6 | Rifinitura: loading states, errori comprensibili, analytics leggero | ⬜ |
| 7 | Test reale con QR in camera + primo cliente pilota | ⬜ |
| 8 | SaaS: registrazione self-service, Stripe, onboarding automatico | ⬜ (non anticipare) |

**Provisioning titolare (finché non c'è la Fase 8):** utente creato a mano in Authentication → Users, poi `update public.bnb_clients set owner_id = '<uuid>' where id = '<slug>';` nell'SQL Editor. Istruzioni complete in fondo a `phase-3-auth.sql`.

**Il QR** codifica solo l'URL `https://dominio/<slug>`: tutta la logica è nel routing dinamico + query per slug.

---

## 8. Registro decisioni (il perché delle scelte)

- **Una tabella `bnb_clients` con jsonb** invece di tabelle separate per wifi/regole/trasporti: meno join, editing granulare rimandato a quando servirà davvero.
- **`id` = slug testuale** (es. `casa-rossa`): è l'URL del QR; niente uuid per le strutture.
- **ISR 300s invece di SSR**: le pagine ospite reggono traffico da CDN e sopravvivono a Supabase spento; la freschezza immediata è garantita da `revalidatePath` dopo ogni salvataggio admin.
- **Client anon separato dal client cookie**: mantiene statiche le pagine ospite (vedi errore n. 5).
- **Mapper centralizzati** (`bnb-mappers.ts`): un solo posto per colonne e conversioni, condiviso da guest e admin.
- **Tema come CSS variables iniettate** invece di classi condizionali: il tema arriva dal DB a runtime, i componenti non sanno nulla dei colori.
- **8 colori del tema, 5 opzionali**: retrocompatibilità totale con le righe create prima (assente = default palette in `globals.css`).
- **Editor colori** (`theme-colors.tsx` + `color-picker-field.tsx` + `theme-preview.tsx`): gruppi Identità/Sfondi/Testo, picker react-colorful in popover, anteprima live sticky che riusa le stesse CSS variables del frontend vero.
- **Contenuti multilingua nell'editor**: lo stato it/en/es viaggia in un campo hidden `payload` JSON; il server normalizza e applica la regola "en sempre, altre solo se non vuote".
- **`sort_order` esplicito sui posti**: l'ordine è una scelta dell'host, non un artefatto del DB.
- **Stack**: Next.js 16 (App Router, Turbopack), Tailwind v4, shadcn/ui (base-nova, icone lucide), sonner per i toast (riscritto senza next-themes), PWA con SW network-first (`public/sw.js`, solo produzione).
- **Manifest/chrome PWA**: colori statici da `brand.ts` (il manifest è unico per l'app, non per-tenant).

---

## 9. Debiti tecnici correnti (in ordine di rischio)

1. ⚠️ **Feedback 1–3 stelle perso**: `review-module.tsx` mostra "Grazie!" e scarta il testo. Serve una tabella `guest_feedback` + policy insert per anon + vista in admin. Finché non c'è, quel canale NON raccoglie nulla.
2. **Colori del tema non validati server-side**: `updateBnbGeneral` salva qualsiasi stringa; un valore malformato produce CSS variables spazzatura (tema rotto, non un exploit: React le confina nel valore della proprietà). Aggiungere validazione `#rrggbb` nell'action.
3. **Link Google Reviews placeholder** (`placeid=PLACEHOLDER` in `review-module.tsx`): andrà per-struttura nel DB.
4. **Meteo finto** nel widget Home (l'orologio invece è reale). Serve un'API.
5. **`next-themes` è una dipendenza morta** (sonner riscritto senza): da rimuovere da package.json.
6. **README.md è ancora il boilerplate** di create-next-app: da sostituire con descrizione reale del progetto.
7. **Blocco `.dark` in `globals.css` mai attivato** (nessun toggle dark): codice morto, innocuo ma fuorviante.
8. **`walkingDistance` campo singolo** non localizzato (per scelta: valore neutro + suffisso localizzato lato UI).
9. **Seed con valori finti**: telefono/WhatsApp di Casa Rossa sono ancora `+390000000000` finché l'utente non li aggiorna dall'admin.

**Risolti** (2026-07-08): `image_url` dei posti non usa più `next/image` (che senza `remotePatterns` crashava la pagina) ma un `<img>` con fallback all'emoji su `onError` — nessun URL può più rompere la guest; `maximumScale: 1` rimosso dal viewport (pinch-zoom libero).

---

## 10. Idee proposte (backlog, non ancora iniziate)

Proposte nate rileggendo il progetto, in ordine di valore/sforzo. Non anticiparle senza richiesta esplicita; sono qui perché non vadano perse.

1. **Salvare il feedback 1–3 stelle** (risolve il debito n. 1). Tabella `guest_feedback` su Supabase (FK `bnb_client_id`, testo, rating, `created_at`) + policy `insert` per `anon` (solo scrittura, nessuna lettura pubblica) + sezione "Feedback ricevuti" nell'admin. È il debito col maggior costo di business: oggi l'ospite scontento crede di averti scritto e tu non ricevi nulla.
2. **Upload immagini via Supabase Storage** — logo, hero e foto dei posti caricati dal pannello (con resize), invece di incollare URL. Risolve alla radice il rischio `image_url`; per gli URL di Storage (host noto) si può reintrodurre `next/image` con un `remotePattern` mirato e riottenere l'ottimizzazione. Per un titolare non tecnico "scatta e carica" è la differenza tra usare le foto e non usarle.
3. **Generatore QR nell'admin** — per ogni struttura: QR scaricabile + pagina A6 stampabile "Wi-Fi & Guida" da mettere in camera. È parte della Fase 4 ma piccolo e ad alto valore: il QR è il canale di distribuzione del prodotto, oggi delegato a tool esterni.
4. **Guardia di contrasto nel theme editor** — calcolo WCAG (rapporto ≥ 4.5:1) sulle coppie testo/sfondo, con avviso live nell'anteprima. In test è bastato mezzo minuto per creare combinazioni illeggibili: un cliente lo farà il giorno uno.
5. **CI su GitHub Actions** — a ogni push: `tsc` + lint + build + test PGlite di schema/policy. Oggi `main` deploya in produzione senza che nessuno verifichi: trasformerebbe la quality bar (sezione 5) da disciplina volontaria a cancello automatico.
