@AGENTS.md

# Concierge Digitale — Manuale operativo

Micro SaaS per B&B/affittacamere di Roma: l'ospite scansiona un QR e apre la guida della struttura (Wi-Fi, regole, trasporti, posti consigliati); il titolare gestisce i contenuti da un pannello protetto. PWA mobile-first, dati su Supabase, deploy su Vercel (`concierge-digitale.vercel.app`, repo GitHub `albeae/concierge-digitale`, deploy automatico a ogni push su `main` — **`main` è produzione**).

**Chi è l'utente**: il proprietario del progetto non è un programmatore. Spiega le scelte in italiano semplice, senza gergo non necessario; esegui e verifica tu invece di chiedere a lui di farlo; quando serve un passo manuale (es. SQL su Supabase), scrivi istruzioni passo-passo a fine risposta.

---

## 1. Mappa del progetto

| Percorso | Responsabilità |
|---|---|
| `src/app/[bnbId]/page.tsx` | Pagina ospite (server component, ISR 300s, `generateStaticParams` dal DB) |
| `src/app/[bnbId]/actions.ts` | Server action ospite: invio feedback privato (client **anon**, la pagina resta statica) |
| `src/app/page.tsx` | Root: redirect al primo B&B (ISR 300s; 404 se DB vuoto) |
| `src/app/admin/**` | Area titolare: login, dashboard, editor, stampa QR (`force-dynamic`, `robots: noindex`) |
| `src/app/admin/actions.ts` | Server action `login`/`logout` |
| `src/app/admin/[bnbId]/actions.ts` | Server action di scrittura (dati generali, contenuti, posti, riordino posti, upload immagini, delete feedback) |
| `src/proxy.ts` | "Middleware" di Next 16 (si chiama proxy): refresh sessione + redirect, solo `/admin/:path*` |
| `src/lib/supabase.ts` | Client **anon puro** — SOLO pagine ospite (lettura) |
| `src/lib/supabase-server.ts` | Client **server con cookie** — SOLO area admin (sessione titolare) |
| `src/lib/data.ts` | Data layer pubblico: `getBnb` / `getBnbIds` / `getPlaces` (async, `cache()`) |
| `src/lib/auth.ts` | DAL admin: `getSessionUser`, `requireUser`, `getOwnedBnb(s)`, `getOwnedBnbPlaces`, `getOwnedBnbFeedback` |
| `src/lib/contrast.ts` | Rapporto di contrasto WCAG (guardia del theme editor) |
| `src/lib/url-validation.ts` | Validazione URL admin→ospite: `isGoogleUrl` (recensioni/Maps), `isImageRef` (logo/hero/foto) |
| `src/lib/rate-limit.ts` | Rate limit in-memory (LRU) per le server action pubbliche (feedback ospite) |
| `src/lib/weather.ts` | Meteo attuale di Roma da Open-Meteo (fetch client-side, codici WMO → condizione) |
| `src/lib/bnb-mappers.ts` | UNICO punto di mappatura righe DB (snake_case) ↔ tipi dominio (camelCase) + elenchi colonne |
| `src/lib/localize.ts` | Fallback lingua per-chiave su `en` — **non modificare la logica** |
| `src/lib/i18n.ts` | Etichette UI fisse in it/en/es (`UiStrings`) |
| `src/lib/contacts.ts` | Solo il 112 e gli helper `telUrl`/`whatsappUrl` (i contatti host vivono nel DB) |
| `src/lib/brand.ts` / `recycling.ts` | Costanti: colori chrome PWA / colori cestini AMA (whitelist hex) |
| `src/types/index.ts` | Tipi di dominio (`Bnb`, `Place`, `Localized<T>`, `BnbTheme`, …) |
| `src/components/*.tsx` | UI ospite (BnbGuide + tab Home/Esplora/Info) |
| `src/components/admin/*.tsx` | UI pannello (form, editor colori con anteprima+guardia contrasto+reset base, upload immagini, QR/scheda stampa, posti in lista compatta con riordino, lista feedback) |
| `src/components/theme-provider.tsx` | Inietta il tema del B&B come CSS variables |
| `supabase/schema.sql` | Fase 2: tabelle + RLS lettura + seed (applicato ✅) |
| `supabase/phase-3-auth.sql` | Fase 3: policy di scrittura titolare (applicato ✅) |
| `supabase/guest-feedback.sql` | Feedback ospiti: tabella + policy (insert anon, lettura/delete titolare) — applicato ✅ |
| `supabase/storage-images.sql` | Bucket `bnb-images` + policy per-cartella `<slug>` — applicato ✅ |
| `supabase/google-reviews.sql` | Colonna `google_reviews_url` su bnb_clients — **da applicare prima del deploy** |
| `scripts/test-sql.mjs` | Test PGlite degli script SQL con stub auth/storage (`npm run test:sql`) |
| `.github/workflows/ci.yml` | CI a ogni push: tsc, lint, test SQL, grep colori, build |
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

**SQL.** Un file per argomento in `supabase/`, rieseguibile senza danni (`if not exists`, guardie su `pg_policies` per le policy, `on conflict do nothing`…), dollar-quoting per i jsonb, commenti che spiegano il perché. Prima del commit va **eseguito davvero**: `npm run test:sql` (PGlite, `scripts/test-sql.mjs`) ricrea auth/ruoli/storage di Supabase, esegue gli script nell'ordine reale (i nuovi due volte, per l'idempotenza) e fa assertion su vincoli e policy con `set role` / `auth.uid()` stubbato. Ogni script nuovo aggiunge lì le proprie assertion. Trappola scovata così: nelle policy su `storage.objects` un `name` non qualificato si lega alla tabella della subquery, va scritto `objects.name`.

**UI.** Mobile-first (l'ospite è al telefono): tap target grandi, card `rounded-3xl`, ombre morbide dai token. Rendering condizionale (non nascondere via CSS). `min-h-*` sui contenitori di testo, mai altezze fisse. Emoji come icone di dominio (regole, trasporti), lucide per la UI.

---

## 4. Errori tipici (nome → regola che li previene)

1. **Il Next.js che ricordi non è questo.** Next 16 ha breaking changes: il middleware si chiama `src/proxy.ts` (export `proxy`), `params` è una `Promise` (sempre `await params`), niente `cacheComponents` (vale il modello ISR classico). Regola: se un'API Next non compare già nel repo, leggi prima la doc locale in `node_modules/next/dist/docs/`.
2. **Il colore scritto a mano.** Un hex nel markup rompe il theming per-struttura. Regola: ogni colore passa da un token; se il token non esiste, aggiungilo in `globals.css` + `ThemeProvider` + (se il titolare deve poterlo cambiare) selettore in `theme-colors.tsx`. Eccezioni: solo la whitelist della sezione 3.
3. **Il bianco che sparisce.** `text-white`/`bg-white` diventa illeggibile con temi chiari; testo `--foreground` su sfondi scuri sparisce. Regola: usa sempre coppie accoppiate (`bg-X` + `text-X-foreground`); i pulsanti outline della guest usano bordo+testo `terracotta`, MAI il variant `outline` nudo (eredita colori di pagina). Unica eccezione `text-white`: le icone dei cestini AMA.
4. **La lingua riempita di vuoti.** Salvare `it: ""` uccide il fallback (l'ospite vede campi vuoti invece dell'inglese). Regola: `en` sempre completo; `it`/`es` si omettono del tutto se vuoti; `localize.ts` non si tocca.
5. **Il client mescolato.** Se una pagina ospite importa `supabase-server.ts` (o `next/headers`) diventa dinamica e perde ISR/CDN. Regola: guest → `supabase.ts`; admin → `supabase-server.ts`. Mai incrociarli.
6. **La scrittura dal posto sbagliato.** Il client anon non può scrivere (RLS) e non deve provarci. Regola: ogni scrittura è una server action admin con i 4 passi della sezione 3 (ownership → normalizza → scrivi → revalida). Unica eccezione deliberata: il feedback ospite (`src/app/[bnbId]/actions.ts`), server action guest sul client anon con policy insert-only dedicata — qualsiasi altra scrittura anon resta vietata.
7. **Il DDL impossibile.** `create table` via API fallisce in silenzio concettuale: c'è solo la anon key. Regola: modifiche di schema = nuovo file `supabase/*.sql` + istruzioni manuali per l'utente + validazione PGlite.
8. **La difesa unica.** "Tanto c'è il proxy" (o "tanto c'è la RLS") è come si creano i buchi. Regola: tutti e tre i livelli, sempre; ogni nuova pagina/azione admin chiama `requireUser`/`getOwnedBnb` anche se il proxy già filtra.
9. **La modifica che non si vede.** Senza `revalidatePath` la pagina ospite resta cache-ata fino a 5 minuti e il titolare crede che il salvataggio sia rotto. Regola: ogni scrittura termina con `refreshGuest(bnbId)`.
10. **Il 500 evitabile.** Un DB vuoto/spento non è un'eccezione: è lo stato normale prima dell'apply SQL. Regola: nel data layer pubblico ogni errore → `console.error` + ritorno vuoto → la pagina fa `notFound()`; `getBnbIds()` che fallisce restituisce `[]` e la build passa.
11. **Lo snake nel dominio.** `host_phone` che gira nei componenti = refactoring doloroso. Regola: la conversione avviene una volta sola in `bnb-mappers.ts`; i componenti vedono solo camelCase.
12. **L'altezza che taglia.** `h-5` fisso + `overflow-hidden` su un badge taglia il testo in verticale (successo davvero). Regola: `min-h-*` sui contenitori di testo; niente `overflow-hidden` dove il contenuto può crescere.
13. **Verificato a occhio.** Uno screenshot non dimostra un colore né un'altezza. Regola: verifica con misure — `preview_inspect`/`getComputedStyle`, status HTTP, `scrollHeight === clientHeight` — e riporta i valori. I default hex derivati dalla palette oklch si calcolano con la conversione matematica.
14. **Il segreto nel repo.** Regola: mai credenziali/chiavi nei file versionati (`.env*` è gitignorato); le credenziali di test admin le fornisce l'utente in sessione, non scriverle in CLAUDE.md o nei commit.
15. **La porta dell'utente.** La 3000 spesso è occupata dal `npm run dev` dell'utente che sta testando. Regola: mai uccidere processi non tuoi; usa il preview (launch.json ha `autoPort`) e se non parte, dillo e vai avanti con verifiche non-browser.
16. **Il comportamento solo-produzione.** Service worker (`process.env.NODE_ENV !== "production"`), banner PWA e simili non si vedono con `npm run dev`. Regola: per verificarli serve una build reale (`npm run build` poi `next start`); il profilo di preview per questo NON sta nel `launch.json` dentro al repo ma in quello della cartella radice della sessione (`.claude/launch.json` accanto al progetto, non versionato) — verificane l'esistenza prima di aggiungerne uno duplicato dentro al repo.
16. **La fase saltata.** Il principio del progetto è "parti piccolo, poi generalizza". Regola: non anticipare infrastruttura delle fasi future (multi-tenant self-service, pagamenti) se non richiesto; una fase alla volta, testata.

---

## 5. Quality bar (criteri verificabili, non aggettivi)

Prima di dichiarare finito un lavoro, TUTTI questi devono passare:

- [ ] `npx tsc --noEmit` → exit 0.
- [ ] `npm run lint` → exit 0, zero warning.
- [ ] `npm run build` → exit 0 **e** nel riepilogo route: `/` e `/[bnbId]` statiche (○/●) con `Revalidate: 5m`; le route admin protette dinamiche (ƒ; `/admin/login` è ○ da sempre, ci pensa il proxy); riga `Proxy (Middleware)` presente.
- [ ] `grep -rn -E "#[0-9a-fA-F]{6}" src/components src/app --include="*.tsx"` → risultati solo nei file whitelist (`theme-colors.tsx`, `color-picker-field.tsx`); `grep -rn "text-white\|bg-white" src/components` → solo `rules-card.tsx` (cestini).
- [ ] Ogni server action di scrittura contiene sia `getOwnedBnb(` sia `refreshGuest(`/`revalidatePath(` (vale per l'admin; l'unica azione guest, il feedback, usa il client anon e non revalida nulla).
- [ ] SQL nuovo: `npm run test:sql` con tutte le assertion ✓ (lo script esegue i file nuovi due volte: niente errori né duplicati).
- [ ] La CI (`.github/workflows/ci.yml`) ripete questi controlli a ogni push: se un check nuovo entra nella bar, va aggiunto anche lì.
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
| 4 | Multi-tenancy: landing/elenco su `/`, generazione QR per struttura | ◐ parziale (QR + scheda A6 fatti il 2026-07-09; resta la landing; il routing `/[slug]` esiste già) |
| 5 | PWA avanzata: già fatti manifest+SW in Fase 1; resta test offline reale su device | ◐ parziale |
| 6 | Rifinitura: loading states, errori comprensibili, analytics leggero | ⬜ |
| 7 | Test reale con QR in camera + primo cliente pilota | ⬜ |
| 8 | SaaS: registrazione self-service, Stripe, onboarding automatico | ⬜ (non anticipare) |

**Provisioning titolare (finché non c'è la Fase 8):** utente creato a mano in Authentication → Users, poi `update public.bnb_clients set owner_id = '<uuid>' where id = '<slug>';` nell'SQL Editor. Istruzioni complete in fondo a `phase-3-auth.sql`.

**Il QR** codifica solo l'URL `https://dominio/<slug>`: tutta la logica è nel routing dinamico + query per slug. Si genera dall'editor (sezione "QR code e stampa"), con scheda A6 stampabile su `/admin/<slug>/stampa`.

**SQL applicati** (2026-07-10): `supabase/guest-feedback.sql` e `supabase/storage-images.sql` sono stati eseguiti in produzione → feedback e upload immagini pienamente attivi.

**⚠️ SQL da applicare PRIMA del prossimo deploy**: `supabase/google-reviews.sql` aggiunge la colonna `google_reviews_url`, che il nuovo codice legge in `BNB_COLUMNS`. Se il codice va live prima della colonna, la SELECT fallisce e le pagine ospite rispondono 404. Ordine: prima l'SQL, poi il push.

**Dominio**: `albeaconcierge.it` collegato a Vercel (2026-07-10). `www` via CNAME `cname.vercel-dns.com`; l'apex via record A verso l'IP di Vercel (attenzione al nome del record su Register.it: dev'essere `albeaconcierge.it`, non `@.albeaconcierge.it`).

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
- **Posti in lista compatta a fisarmonica** (`places-editor.tsx`): righe sintetiche (categoria a larghezza fissa per allineare i nomi, distanza) che si aprono al tap sul form completo; "+ Aggiungi un posto" mostra la scheda vuota solo su richiesta; oltre 3 posti la lista si collassa dietro "Vedi tutti".
- **Riordino posti client-authoritative + ottimistico**: le frecce ↑↓ riordinano la lista SUBITO nel client (stato locale, `setItems`) e in background la server action `reorderPlaces` riceve l'ordine COMPLETO e riscrive `sort_order = posizione`. Così niente attesa/refresh percepiti, niente race tra click rapidi (l'ultimo ordine vince) e nessun problema con ordini duplicati; su errore si fa rollback + `router.refresh`. Ha sostituito il vecchio `movePlace` "sposta di uno" (che con i duplicati trascinava altri posti).
- **Feedback ospiti solo-scrittura**: l'anon può inserire ma MAI leggere (`guest_feedback` senza policy select per anon); l'invio passa da una server action guest col client anon, così validazione e log stanno sul server ma la pagina resta statica.
- **WAF feedback (decisione 2026-07-10)**: per il pilot la regola Vercel WAF si aggancia ai POST delle route guest `/<slug>`. Oggi l'unica mutazione pubblica su queste pagine è `submitGuestFeedback`, quindi la regola protegge precisamente il feedback senza introdurre un endpoint `/api`. L'admin `/admin/*` non rientra nella regola. Se in futuro si aggiunge un'altra Server Action pubblica alle pagine guest, rivalutare la regola oppure estrarre il feedback in un endpoint dedicato. Valori e passi in `docs/vercel-waf-feedback-rate-limit.md`.
- **Storage per-cartella**: bucket pubblico `bnb-images`, percorsi `<slug>/<tipo>-<timestamp>` e policy che confrontano `(storage.foldername(objects.name))[1]` con le strutture possedute. Nome file sempre nuovo: mai combattere la cache CDN con l'upsert.
- **QR generato nel browser** con `window.location.origin`: l'admin gira sullo stesso deploy della guest, quindi in produzione l'URL è quello vero senza config. Colori fissi nero/bianco (non a tema): un QR a basso contrasto non si scansiona.
- **Guardia contrasto per tipo di testo** (`theme-preview.tsx`): ogni coppia testo/sfondo ha la sua soglia — 4.5 per il testo di lettura (paragrafi su sfondi), 3 per il testo grande su colore (header, pulsanti). Due livelli d'avviso: rosso sotto 3, soft tra 3 e la soglia. Così il tema di fabbrica (bianco su terracotta ≈ 4.3) NON viene segnalato (si legge benissimo, ed è testo grande). La coppia del micro-badge accento è esclusa (decorativa, dava un rosso fisso).
- **Pulsante "Colori base"** nel theme selector: reimposta gli 8 colori alla palette base dell'app (`BASE_COLORS` in `theme-colors.tsx`, gli stessi dell'interfaccia admin/`:root`). Solo stato locale → l'utente vede l'anteprima e poi salva; serve a chiunque abbia pasticciato i colori durante le prove.
- **Meteo reale client-side** (`weather.ts` + `home-widgets.tsx`): Open-Meteo (gratis, no key, CORS) chiamato dal browser dell'ospite → le pagine restano statiche. Coordinate fisse su Roma; condizioni in 8 famiglie con icona e testo localizzato; su errore un placeholder discreto (niente widget rotto).
- **Link recensioni per-struttura** (`google_reviews_url`): il voto ≥4 apre il link Google della struttura; se vuoto, il modulo ringrazia soltanto (niente redirect a un placeholder). Colonna diretta, non jsonb, come gli altri contatti host.
- **Colori del tema validati server-side** (`updateBnbGeneral`): i 3 obbligatori devono essere `#rrggbb` (altrimenti errore), i 5 opzionali si salvano solo se validi. Niente CSS variables spazzatura da input malformati.
- **Stack**: Next.js 16 (App Router, Turbopack), Tailwind v4, shadcn/ui (base-nova, icone lucide), sonner per i toast (riscritto senza next-themes), `qrcode` per i QR, PWA con SW network-first (`public/sw.js`, solo produzione).
- **Manifest/chrome PWA**: colori statici da `brand.ts` (il manifest è unico per l'app, non per-tenant).

---

## 9. Debiti tecnici correnti (in ordine di rischio)

1. **Contrasto di fabbrica del badge ZTL/accento**: `primaryForeground` su `secondaryColor` (ocra) è ~2.3:1 — leggibile a fatica. La guardia contrasto non lo segnala più (coppia esclusa perché micro-badge decorativo), ma resta un miglioramento estetico: scurire l'ocra del seed o passare il badge a testo scuro.
2. **`next-themes` è una dipendenza morta** (sonner riscritto senza): da rimuovere da package.json.
3. **README.md è ancora il boilerplate** di create-next-app: da sostituire con descrizione reale del progetto.
4. **Blocco `.dark` in `globals.css` mai attivato** (nessun toggle dark): codice morto, innocuo ma fuorviante.
5. **`walkingDistance` campo singolo** non localizzato (per scelta: valore neutro + suffisso localizzato lato UI).
6. **Seed con valori finti**: telefono/WhatsApp di Casa Rossa sono ancora `+390000000000` finché l'utente non li aggiorna dall'admin.
7. **Meteo su Roma fissa**: le coordinate sono fisse (tutte le strutture sono a Roma); per il multi-città servirà lat/lon per-struttura nel DB.

**Risolti** (2026-07-08): `image_url` dei posti non usa più `next/image` (che senza `remotePatterns` crashava la pagina) ma un `<img>` con fallback all'emoji su `onError` — nessun URL può più rompere la guest; `maximumScale: 1` rimosso dal viewport (pinch-zoom libero).

**Risolti** (2026-07-09): il feedback 1–3 stelle viene salvato in `guest_feedback` e letto dall'admin (era il debito n. 1); i selettori colore non sbordano più a destra su telefono (tripla causa: `min-width: min-content` dei fieldset con hint in nowrap, popover a larghezza fissa, zoom automatico di iOS sugli input sotto i 16px).

**Risolti** (2026-07-10): riordino posti che "trascinava" altri posti (era lo scambio secco dei `sort_order` con duplicati → ora `reorderPlaces` riscrive l'ordine completo, con update ottimistico per la velocità); frecce di riordino ingrandite (28→36px, con bordo) per il tocco su mobile; nomi dei posti allineati (badge categoria a larghezza fissa); guardia contrasto senza falsi allarmi sul tema di fabbrica (soglia per tipo di testo); pulsante "Colori base" per resettare il tema.

**Risolti** (2026-07-10, rifinitura pre-cliente): meteo reale di Roma via Open-Meteo (`lib/weather.ts`, era finto — debito n. 3); link recensioni Google per-struttura (colonna `google_reviews_url` + campo admin, era il placeholder — debito n. 2), vuoto = solo ringraziamento; validazione colori `#rrggbb` server-side in `updateBnbGeneral` (era il debito n. 1).

---

## 10. Idee proposte (backlog)

Le 5 idee del primo giro sono state **tutte implementate il 2026-07-09** (branch `idee-backlog`): feedback ospiti salvato, upload immagini via Storage, generatore QR + scheda A6, guardia di contrasto WCAG, CI su GitHub Actions. Dettagli nelle sezioni 1, 8 e 9.

Rimaste fuori di proposito (annotate per non perderle):

1. **`next/image` per gli URL di Storage** — ora che le immagini caricate stanno su un host noto, un `remotePattern` mirato al progetto Supabase ridarebbe l'ottimizzazione automatica (il `<img>` con fallback resta per gli URL esterni incollati a mano).
2. **Pulizia immagini orfane su Storage** — ogni upload crea un file nuovo (scelta anti-cache); i vecchi restano nel bucket. Prima o poi: elenco file per cartella e cestino nell'admin.

Le prossime proposte si aggiungono qui, in ordine di valore/sforzo; non anticiparle senza richiesta esplicita, a meno che non si tratti di cose tecniche che il proprietario in quanto principiante non comprende.

---

## 11. Review Codex richiesta dal proprietario (2026-07-10)

Questa sezione è stata aggiunta da **Codex**, dopo la richiesta esplicita del proprietario di fare una review del lavoro svolto con Claude Code. È un registro di problemi e miglioramenti emersi dalla review: non indica modifiche già implementate, salvo dove indicato diversamente.

### Esito della review

La base è solida e appropriata per il primo cliente: separazione netta fra guest statico e admin dinamico, difesa su proxy + DAL + RLS, mapper centralizzati, fallback i18n e test PGlite delle policy sono scelte da mantenere. Non anticipare la complessità SaaS della Fase 8.

Verifiche fatte il 2026-07-10: `npx tsc --noEmit`, lint, `npm run test:sql` e `npm run test:unit` passati; build di produzione passata con `/` e `/[bnbId]` statiche/ISR a 5 minuti, route admin dinamiche e `Proxy (Middleware)` presente. La prima build locale non poteva scaricare Geist da Google per il blocco rete del sandbox; con rete disponibile la build è passata. Non è un difetto applicativo, ma la build dipende dal download dei font Google.

### Problemi da risolvere prima del cliente pilota

1. ✅ **RISOLTO (2026-07-10) — PWA e area admin (privacy).** `isAdminPath()` in `public/sw.js` esclude `/admin` e `/admin/*` dal fetch handler: niente cache, niente fallback offline per l'area admin, sempre e solo rete + sessione reale. Cache version bump v2→v3 per svuotare eventuali copie admin già salvate. Verificato con build di produzione reale: `/admin/login` visitata non finisce mai in cache; `/casa-rossa` (ospite) resta cache-ata come previsto. Nel fixare questo è emerso un bug distinto e più grave: `ServiceWorkerRegister` non si registrava MAI in produzione in questo ambiente (aspettava l'evento `load`, che se già scattato prima del mount dell'effect non veniva più intercettato) — corretto con un controllo su `document.readyState`. Senza quel secondo fix il service worker (e quindi anche questa esclusione admin) non si sarebbe mai attivato da solo.
2. 🟡 **MITIGATO (2026-07-10), non chiuso — Feedback ospite senza limite.** Applicata la seconda barriera (a livello applicativo); manca la prima barriera al margine della rete. Cosa c'è:
   - `src/lib/rate-limit.ts`: finestra fissa in-memory (`isRateLimited(key, limit, windowMs)`), applicata in `submitGuestFeedback` su due chiavi — per IP+struttura (5 invii / 10 minuti) e per struttura intera (30 invii / ora, tetto sui costi anche con IP diversi).
   - Honeypot invisibile (`website`, `sr-only` + `aria-hidden` + fuori dal tab order) in `review-module.tsx`: se arriva compilato si finge successo senza scrivere, senza dare indizi al bot. In ogni caso di blocco il messaggio resta il generico "qualcosa è andato storto".
   - Memoria E CPU limitate insieme, via **LRU su Map** (`MAX_BUCKETS = 10_000`): un flood di IP DISTINTI riempirebbe la Map di bucket "vivi" (DoS di memoria) e ordinarli tutti a ogni saturazione per sfrattarli sarebbe O(n log n) ripetuto (DoS di CPU). Soluzione: la Map JS conserva l'ordine di inserimento, a ogni accesso spostiamo il bucket in coda (delete+set = O(1)), lo sfratto toglie un blocco dalla testa in O(batch) senza sort. Bonus: il contatore per-struttura, toccato a ogni invio, resta sempre in coda e non viene mai sfrattato (è quello che protegge i costi); sotto sfratto cadono per primi i bucket per-IP mordi-e-fuggi.
   - Test automatico in CI (`npm run test:unit`, `scripts/test-rate-limit.mjs`): limite, indipendenza delle chiavi, scadenza della finestra, **tetto verificato leggendo la size reale** (`__bucketCountForTests()` asserisce ≤ 10_000 dopo 20k chiavi) e sopravvivenza LRU della chiave calda sotto flood. Non più solo verifica manuale.
   - **Limite strutturale che resta aperto:** il contatore è per-istanza serverless e si azzera ai cold start; un abuso DISTRIBUITO su molti IP può aggirarlo continuando a generare costi. La difesa vera contro quello va messa al margine della rete, PRIMA che la funzione parta: rate limit / WAF di Vercel. **Il WAF (regola da dashboard) è incluso anche nel piano gratuito Hobby** — Fixed Window, chiave IP, finestra max 10 min, 1 regola per progetto; l'SDK `@vercel/firewall` invece richiede Pro/Enterprise, quindi non è la strada per questo piano. **La regola è già specificata e pronta da applicare a mano** in `docs/vercel-waf-feedback-rate-limit.md` (POST alle route guest, esclusa `/admin`, 10 req/60s per IP, Deny 429). **TODO prima di aprire il QR al pubblico su larga scala:** applicarla nella dashboard e verificarla. Nota di scalabilità futura: lo sfratto LRU in-app è ottimo per il pilota; per flood enormi in-process valutare una coda/min-heap dedicata — ma col WAF davanti non dovrebbe mai essere il collo di bottiglia.
3. ✅ **RISOLTO (2026-07-10) — Riordino posti non atomico.** Il riordino ora è una funzione SQL, `public.reorder_places(bnb_id, ordered_ids[])` (`supabase/reorder-places.sql`), chiamata via `supabase.rpc` da `reorderPlaces`. Prima di scrivere valida che la lista sia ESATTAMENTE una permutazione dei posti della struttura (stessa cardinalità, nessun duplicato, ogni id appartiene alla struttura) e poi riscrive `sort_order = posizione` in **un'unica UPDATE** dentro la funzione (atomica: o tutte le righe o nessuna). Una richiesta parziale/duplicata/manipolata solleva un'eccezione → nessuna scrittura parziale. `security invoker` (la RLS resta valida) + controllo esplicito di proprietà. Test in `test:sql`: permutazione valida, lista parziale (con verifica che l'ordine NON cambi), duplicato, id estraneo, non-proprietario. **⚠️ Migrazione da applicare in Supabase PRIMA del deploy** (vedi checklist migrazioni).
4. ✅ **RISOLTO (2026-07-10) — URL pubblicati senza validazione.** `src/lib/url-validation.ts`: `isGoogleUrl` (https + host Google veri, confrontando l'hostname e non una substring → `google.com.evil.com`/`evilgoogle.com` respinti) per `google_reviews_url` (updateBnbGeneral) e `google_maps_url` (upsertPlace); `isImageRef` (https o path relativo alla root, così i default `/*.svg` e gli upload Supabase passano ma `http:`/`data:`/`//` no) per logo, hero e foto posto. Valore sbagliato → errore chiaro nel form, mai salvataggio silenzioso. Test in `test:unit` (`scripts/test-url-validation.mjs`) inclusi i casi di spoofing.
5. ✅ **RISOLTO parziale (2026-07-10) — CI dopo il deploy.** Aggiunto il trigger `pull_request` al workflow (`on: [push, pull_request]`): una PR verso `main` viene verificata PRIMA del merge. **Resta da fare, lato GitHub (non versionabile):** attivare la *branch protection* su `main` (Settings → Branches → Add rule) imponendo "Require status checks to pass" con il job CI e "Require a pull request before merging". Solo così il cancello diventa vincolante e Vercel non può deployare con la CI rossa. Finché `main` è pushabile direttamente, la race deploy-prima-di-CI resta possibile: la mitigazione pratica è lavorare a PR.

### Miglioramenti consigliati per le prossime fasi

1. **Fase 4:** trasformare `/` in una landing essenziale (valore del prodotto, demo, call to action) invece di reindirizzare al primo B&B. Il routing per slug è già pronto; non serve un elenco pubblico automatico delle strutture.
2. **QR di produzione:** il QR usa `window.location.origin`, scelta corretta sul deploy di produzione ma rischiosa se stampato da una preview Vercel. Preferire un URL pubblico esplicito per la stampa oppure disabilitare la stampa fuori da produzione.
3. **Fase 5:** dopo la correzione della cache admin, eseguire il test offline su iPhone e Android: prima visita, modalità aereo, lettura contenuti, ritorno online dopo un salvataggio admin e aggiornamento della cache.
4. **Fase 6:** aggiungere pochi test end-to-end ripetibili (guest, login, salvataggio admin, feedback e QR). I test SQL sono ottimi per schema/RLS, ma non coprono l'interfaccia e i flussi browser. Aggiungere inoltre un indicatore di feedback non letti nell'admin: oggi i commenti negativi vengono salvati ma il titolare deve ricordarsi di aprire la lista.
5. **Osservabilità e privacy:** prima di introdurre analytics, definire le sole metriche utili al pilota (scansione QR, apertura guida, invio feedback), non raccogliere PII e documentare i servizi terzi già usati dal browser (Google Maps e Open-Meteo) nella pagina privacy da validare con chi cura gli aspetti legali.
6. **Migrazioni:** finché gli SQL vengono applicati manualmente va bene per il pilot, ma mantenere una checklist/versione delle migrazioni realmente applicate in produzione. Ogni nuova colonna letta dal codice deve avere sempre l'ordine: SQL applicato → verifica → commit/push.

### Migrazioni SQL da applicare prima del deploy (ordine: SQL → verifica → push)

- `supabase/google-reviews.sql` (già applicato): aggiunge `google_reviews_url` a `bnb_clients`. Se il codice che lo legge (`BNB_COLUMNS`) arriva prima della colonna, la query pubblica fallisce e la pagina guest va in 404.
- `supabase/reorder-places.sql` (**da applicare**): crea la funzione `reorder_places`. Il nuovo `reorderPlaces` la chiama via `supabase.rpc`; se la funzione non esiste ancora nel DB, il riordino dei posti nell'admin fallisce (con rollback lato client). È idempotente: eseguibile due volte senza danni. **Applicarla in Supabase → verificare con `npm run test:sql` → poi push.**

---

## 12. Workflow Claude Code + Codex (2026-07-10)

Questa sezione è stata aggiunta da **Codex** su richiesta del proprietario, per usare Claude Code e Codex nello stesso progetto senza duplicare lavoro né creare conflitti nel checkout.

### Scelta consigliata

Usare **Claude Code come ambiente principale** e installare il plugin ufficiale `openai/codex-plugin-cc`: Claude Code resta l'autore principale del codice, Codex interviene come revisore indipendente e per le verifiche. Il plugin usa lo stesso repository locale, la stessa configurazione e autenticazione della CLI Codex; non serve passare continuamente da un'app all'altra né copiare manualmente il diff.

Installazione da eseguire in Claude Code (una sola volta):

```text
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/codex:setup
```

Serve Codex autenticato tramite account ChatGPT oppure API key. `/codex:setup` verifica i requisiti e può proporre l'installazione della CLI Codex se manca.

### Ruoli dei modelli

| Situazione | Strumento/modello | Compito |
|---|---|---|
| Modifica piccola, UI, form, contenuti | Claude Code + Sonnet | Implementazione veloce |
| Auth, RLS, SQL, PWA, refactor ampio | Claude Code + Opus | Implementazione ad alta attenzione |
| Nuova fase o decisione ambigua | Claude Code + Fable | Solo piano: file, rischi, test e criteri di accettazione; non scrive codice |
| Review sicurezza/architettura | Codex | Review indipendente del diff, senza modifiche |
| Build, test, regressioni e QA | Codex | Esegue verifiche e riporta risultati concreti |

Sonnet è il default per la maggior parte del lavoro. Opus va riservato ai cambi ad alto rischio o molto trasversali; Fable serve solo quando serve un piano approfondito per un lavoro lungo, non per ogni feature.

### Flusso normale

```text
Claude Code (Sonnet/Opus implementa)
        ↓
/codex:review --base main --background
        ↓
Claude Code corregge i rilievi concreti
        ↓
/codex:review --base main
```

Per le modifiche rischiose (PWA/cache, Supabase/RLS, auth, migrazioni SQL, race condition), usare prima la review avversariale:

```text
/codex:adversarial-review --base main --background controlla cache PWA, autorizzazioni RLS, race condition e regressioni guest/admin
```

Per una nuova fase complessa il flusso completo è:

```text
Claude Code + Fable (solo piano)
        ↓
Codex valida piano e rischi, se necessario
        ↓
Claude Code + Opus implementa
        ↓
Codex review + test
        ↓
Claude Code corregge
```

### Regole di sicurezza del workflow

1. **Un solo agente scrive file alla volta.** Non usare `/codex:rescue` per implementare mentre Claude Code sta modificando lo stesso checkout.
2. **Codex review è read-only.** Usare `/codex:review` per il review normale e `/codex:adversarial-review` per mettere in discussione decisioni e rischi; entrambi non modificano codice.
3. **`/codex:rescue` solo per lavoro isolato.** Se serve delegare una correzione a Codex, fermare Claude Code oppure usare un branch/worktree separato.
4. **Niente review gate automatico come default.** Il gate può creare cicli Claude↔Codex lunghi e consumare rapidamente l'utilizzo; abilitarlo solo durante una sessione monitorata.
5. **`CLAUDE.md` resta la fonte di verità.** Ogni agente deve leggerlo prima di pianificare, implementare o fare review. Il piano di una fase va conservato nel task/branch o incollato nel prompt dell'implementatore: non affidarsi alla memoria di chat diverse.
6. **L'app Codex separata è opzionale.** Usarla per una review lunga e interattiva, per riprendere un task trasferito con `/codex:transfer`, o per lavoro isolato in un worktree; non è necessaria per il ciclo quotidiano.
