@AGENTS.md

# Concierge Digitale — Manuale operativo

Micro SaaS per B&B/affittacamere di Roma: l'ospite scansiona un QR e apre la guida della struttura (Wi-Fi, regole, trasporti, posti consigliati); il titolare gestisce i contenuti da un pannello protetto. PWA mobile-first, dati su Supabase, deploy su Vercel — dominio `albeaconcierge.it` (+ `concierge-digitale.vercel.app`), repo GitHub `albeae/concierge-digitale`, **`main` è produzione** e deploya a ogni merge.

**Chi è l'utente**: il proprietario non è un programmatore. Spiega le scelte in italiano semplice, senza gergo inutile; esegui e verifica tu invece di chiedere a lui; ogni passo manuale (es. SQL su Supabase) va elencato numerato a fine risposta, pronto da incollare.

---

## 1. Mappa del progetto

| Percorso | Responsabilità |
|---|---|
| `src/app/[bnbId]/page.tsx` | Pagina ospite (server component, ISR 300s, `generateStaticParams` dal DB) |
| `src/app/[bnbId]/actions.ts` | Server action ospite: feedback privato (client **anon**, la pagina resta statica) |
| `src/app/page.tsx` | Root: redirect al primo B&B (ISR 300s; 404 se DB vuoto) — diventerà landing (Fase 4) |
| `src/app/admin/**` | Area titolare: login, dashboard, editor, stampa QR (`force-dynamic`, `robots: noindex`) |
| `src/app/admin/actions.ts` | Server action `login`/`logout` |
| `src/app/admin/[bnbId]/actions.ts` | Server action di scrittura (dati generali, contenuti, posti, riordino via `rpc reorder_places`, upload immagini, delete feedback) |
| `src/proxy.ts` | "Middleware" di Next 16 (si chiama proxy): refresh sessione + redirect, solo `/admin/:path*` |
| `src/lib/supabase.ts` | Client **anon puro** — SOLO pagine ospite (lettura) |
| `src/lib/supabase-server.ts` | Client **server con cookie** — SOLO area admin (sessione titolare) |
| `src/lib/data.ts` | Data layer pubblico: `getBnb`/`getBnbIds`/`getPlaces` (async, `cache()`) |
| `src/lib/auth.ts` | DAL admin: `getSessionUser`, `requireUser`, `getOwnedBnb(s)`, `getOwnedBnbPlaces`, `getOwnedBnbFeedback` |
| `src/lib/bnb-mappers.ts` | UNICO punto di mappatura righe DB (snake_case) ↔ dominio (camelCase) + elenchi colonne |
| `src/lib/localize.ts` | Fallback lingua per-chiave su `en` — **non modificare la logica** |
| `src/lib/i18n.ts` | Etichette UI fisse in it/en/es (`UiStrings`) |
| `src/lib/contrast.ts` / `url-validation.ts` / `rate-limit.ts` | Contrasto WCAG (theme editor); `isGoogleUrl`/`isImageRef` (validazione URL admin); rate limit in-memory LRU (feedback ospite) |
| `src/lib/weather.ts` / `contacts.ts` | Meteo Roma da Open-Meteo (client-side, WMO → condizione); 112 + helper `telUrl`/`whatsappUrl` |
| `src/lib/brand.ts` / `recycling.ts` | Costanti whitelist hex: colori chrome PWA / cestini AMA |
| `src/types/index.ts` | Tipi di dominio (`Bnb`, `Place`, `Localized<T>`, `BnbTheme`, …) |
| `src/components/*.tsx` | UI ospite (BnbGuide + tab Home/Esplora/Info) |
| `src/components/admin/*.tsx` | UI pannello (form, editor colori con anteprima+guardia contrasto+reset, upload, QR/scheda stampa, posti con riordino, feedback) |
| `src/components/theme-provider.tsx` | Inietta il tema del B&B come CSS variables |
| `supabase/*.sql` | Migrazioni manuali, ordine: `schema` → `phase-3-auth` → `guest-feedback` → `storage-images` → `google-reviews` → `reorder-places`. **Tutte applicate in produzione (verificato con query dirette il 2026-07-10)** |
| `scripts/test-sql.mjs` | Test PGlite degli script SQL con stub auth/storage (`npm run test:sql`) |
| `scripts/test-rate-limit.mjs` / `test-url-validation.mjs` | Unit test (`npm run test:unit`) |
| `.github/workflows/ci.yml` | CI su push e PR: tsc, lint, test SQL + unit, grep colori, build |
| `public/sw.js`, `src/app/manifest.ts` | PWA: SW network-first solo produzione, MAI cache su `/admin` + manifest |
| `docs/` | Note operative (es. `vercel-waf-feedback-rate-limit.md`: regola WAF sul feedback) |

---

## 2. Architettura dati (i due binari)

**Binario ospite (pubblico, statico):** `page.tsx` → `data.ts` → `supabase.ts` (anon) → RLS `select using (true)`. Pagine statiche con `revalidate = 300`: CDN + rigenerazione max ogni 5 minuti. Su errore DB il data layer logga e restituisce vuoto → `notFound()`; la build non fallisce mai per un DB vuoto.

**Binario titolare (protetto, dinamico):** richiesta → `proxy.ts` (refresh sessione + redirect) → pagina admin `force-dynamic` → `auth.ts` (`requireUser` + filtro `owner_id`) → server action → `supabase-server.ts` (JWT nei cookie) → RLS `auth.uid() = owner_id` → `revalidatePath('/[bnbId]')`.

**Tre livelli di difesa, sempre tutti e tre:** proxy (ottimistico) + `requireUser`/`getOwnedBnb` in pagine e azioni + RLS nel DB. Nessuno dei tre da solo è sufficiente.

**Schema DB** (dettagli in `supabase/schema.sql`):
- `bnb_clients`: `id` = slug URL (testo), `owner_id` uuid nullable → `auth.users` (non univoco: un titolare, più strutture), `theme`/`toggles`/`content`/`location` jsonb, `address`, `host_phone`, `host_whatsapp`, `google_reviews_url`. Wi-Fi/regole/trasporti vivono DENTRO i jsonb: niente tabelle nuove senza necessità reale.
- `restaurants`: FK `bnb_client_id` (cascade), `category` check (`ristorante|bar|servizio`), `name`/`description` jsonb localizzati, `walking_distance`, `image_url`, `google_maps_url`, `sort_order` (ordine SEMPRE esplicito).
- `guest_feedback`: insert per anon, lettura/delete solo titolare (nessuna select anon).
- La **anon key è l'unica chiave disponibile**: il codice non può fare DDL. Ogni modifica di schema = nuovo file `supabase/*.sql` che l'utente esegue a mano nell'SQL Editor, nell'ordine: **SQL applicato → verifica → commit/push** (mai codice live che legge colonne inesistenti: la SELECT fallirebbe → pagine ospite in 404).

---

## 3. Convenzioni del repo

**Lingua.** Codice, commenti, commit, testi admin: italiano. Contenuti ospite: it/en/es con `en` base obbligatoria.

**Commit.** Conventional in italiano con la fase: `feat(fase-3): …`, `fix: …`, `docs: …`. Commit logici separati (SQL / codice / docs). Chiudi con `Co-Authored-By: Claude <modello> <noreply@anthropic.com>`.

**Autonomia (dal 2026-07-10).** Il proprietario si fida e non revisiona il codice: implementare, verificare con la quality bar (sezione 5) e mergiare le PR a CI verde SENZA chiedere conferma è il default. Da confermare sempre: operazioni distruttive/irreversibili e ogni migrazione SQL da applicare a mano su Supabase. A fine lavoro riporta sempre cosa è stato fatto: l'autonomia è sul procedere, non sulla trasparenza.

**Colori e token.** Nessun colore/ombra/raggio scritto a mano nei componenti: solo utility Tailwind mappate su CSS variables (`bg-terracotta`, `text-primary-foreground`, `shadow-soft`…). Tema per-struttura iniettato da `ThemeProvider` in tre famiglie: identità (`--primary`/`--terracotta`/`--terracotta-strong`/`--ring`, `--ochre`), sfondi (`--background`, `--card`/`--popover`, `--secondary`/`--accent`), testo (`--foreground`/`--card-foreground`/`--popover-foreground`, `--muted-foreground`, `--primary-foreground`). I 5 colori opzionali, se assenti, non sovrascrivono nulla. Whitelist hex: `brand.ts`, `recycling.ts`, `DEFAULTS` in `theme-colors.tsx` (default calcolati per conversione matematica da oklch, non a occhio).

**Localizzazione.** `Localized<T> = { en: T } & Partial<Record<Locale, T>>`. `en` sempre presente; fallback per-chiave (`resolveLocalized`) o per-testo (`pick`). Nel salvataggio: `en` sempre scritto, `it`/`es` omessi se completamente vuoti. Nuova lingua = 1 valore in `Locale` + 1 blocco in `i18n.ts` + contenuti nel DB.

**Dati.** Dominio camelCase; righe DB snake_case; conversione ed elenchi colonne SOLO in `bnb-mappers.ts`. Query pubbliche in `data.ts` (con `cache()`), query admin in `auth.ts`.

**Scritture.** Solo da server action admin, sempre in quest'ordine: (1) `getOwnedBnb(bnbId)` → errore se null; (2) normalizzazione input (niente fiducia nel client); (3) scrittura col client server; (4) `revalidatePath`. Ritorno `ActionState` (`{ok:true,message}` / `{ok:false,error}`) con messaggi in italiano comprensibili a un non tecnico.

**SQL.** Un file per argomento in `supabase/`, rieseguibile senza danni (`if not exists`, guardie su `pg_policies`, `on conflict do nothing`), dollar-quoting per i jsonb, commenti sul perché. Prima del commit: `npm run test:sql` (PGlite ricrea auth/ruoli/storage, esegue gli script nell'ordine reale, i nuovi due volte per l'idempotenza, con assertion su vincoli e policy). Ogni script nuovo aggiunge lì le proprie assertion. Trappola nota: nelle policy su `storage.objects` scrivere `objects.name`, non `name` (si legherebbe alla tabella della subquery).

**UI.** Mobile-first: tap target grandi, card `rounded-3xl`, ombre dai token. Rendering condizionale (non nascondere via CSS). `min-h-*` sui contenitori di testo, mai altezze fisse. Emoji come icone di dominio, lucide per la UI.

---

## 4. Errori tipici (nome → regola che li previene)

1. **Il Next.js che ricordi non è questo.** Next 16: middleware = `src/proxy.ts` (export `proxy`), `params` è una `Promise` (sempre `await`), niente `cacheComponents`. Se un'API non compare già nel repo, leggi prima `node_modules/next/dist/docs/`.
2. **Il colore scritto a mano.** Un hex nel markup rompe il theming. Ogni colore passa da un token; se manca, aggiungilo in `globals.css` + `ThemeProvider` + (se modificabile dal titolare) `theme-colors.tsx`. Eccezioni: solo la whitelist (sezione 3).
3. **Il bianco che sparisce.** `text-white`/`bg-white` illeggibili coi temi chiari. Usa coppie accoppiate (`bg-X` + `text-X-foreground`); i pulsanti outline guest usano bordo+testo `terracotta`, MAI il variant `outline` nudo. Unica eccezione `text-white`: i cestini AMA.
4. **La lingua riempita di vuoti.** Salvare `it: ""` uccide il fallback. `en` sempre completo; `it`/`es` omessi del tutto se vuoti; `localize.ts` non si tocca.
5. **Il client mescolato.** Una pagina ospite che importa `supabase-server.ts` (o `next/headers`) diventa dinamica e perde ISR/CDN. Guest → `supabase.ts`; admin → `supabase-server.ts`. Mai incrociarli.
6. **La scrittura dal posto sbagliato.** Ogni scrittura è una server action admin coi 4 passi della sezione 3. Unica eccezione deliberata: il feedback ospite (`src/app/[bnbId]/actions.ts`, client anon, policy insert-only, rate limit + honeypot) — qualsiasi altra scrittura anon resta vietata.
7. **Il DDL impossibile.** C'è solo la anon key: modifiche di schema = nuovo file `supabase/*.sql` + istruzioni manuali + validazione PGlite.
8. **La difesa unica.** "Tanto c'è il proxy" (o la RLS) è come nascono i buchi. Tutti e tre i livelli, sempre; ogni nuova pagina/azione admin chiama `requireUser`/`getOwnedBnb`.
9. **La modifica che non si vede.** Senza `revalidatePath` la pagina ospite resta cache-ata fino a 5 minuti. Ogni scrittura termina con `refreshGuest(bnbId)`.
10. **Il 500 evitabile.** DB vuoto/spento è uno stato normale. Nel data layer pubblico ogni errore → `console.error` + ritorno vuoto → `notFound()`; `getBnbIds()` che fallisce restituisce `[]` e la build passa.
11. **Lo snake nel dominio.** La conversione avviene una volta sola in `bnb-mappers.ts`; i componenti vedono solo camelCase.
12. **L'altezza che taglia.** `min-h-*` sui contenitori di testo; niente `overflow-hidden` dove il contenuto può crescere.
13. **Verificato a occhio.** Uno screenshot non dimostra un colore né un'altezza. Verifica con misure (`preview_inspect`/`getComputedStyle`, status HTTP, `scrollHeight === clientHeight`) e riporta i valori.
14. **Il segreto nel repo.** Mai credenziali nei file versionati (`.env*` è gitignorato); le credenziali di test admin le fornisce l'utente in sessione, non scriverle in CLAUDE.md né nei commit.
15. **La porta dell'utente.** La 3000 spesso è del `npm run dev` dell'utente. Mai uccidere processi non tuoi; usa il preview (`autoPort`); se non parte, dillo e prosegui con verifiche non-browser.
16. **Il comportamento solo-produzione.** Service worker e banner PWA non si vedono con `npm run dev`: serve `npm run build` + `next start`. Il profilo di preview per questo sta nel `launch.json` della cartella radice della sessione (non versionato), non nel repo: verifica che esista prima di crearne uno duplicato.
17. **La fase saltata.** "Parti piccolo, poi generalizza": non anticipare infrastruttura delle fasi future (multi-tenant self-service, pagamenti) se non richiesto; una fase alla volta, testata.

---

## 5. Quality bar (criteri verificabili, non aggettivi)

Prima di dichiarare finito un lavoro, TUTTI questi devono passare:

- [ ] `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0, zero warning.
- [ ] `npm run build` → exit 0 **e** nel riepilogo route: `/` e `/[bnbId]` statiche (○/●) con `Revalidate: 5m`; route admin dinamiche (ƒ; `/admin/login` è ○, ci pensa il proxy); riga `Proxy (Middleware)` presente.
- [ ] `grep -rn -E "#[0-9a-fA-F]{6}" src/components src/app --include="*.tsx"` → solo file whitelist (`theme-colors.tsx`, `color-picker-field.tsx`); `grep -rn "text-white\|bg-white" src/components` → solo `rules-card.tsx`.
- [ ] Ogni server action di scrittura admin contiene sia `getOwnedBnb(` sia `refreshGuest(`/`revalidatePath(`.
- [ ] SQL nuovo: `npm run test:sql` con tutte le assertion ✓. Codice con test unit toccato: `npm run test:unit` ✓.
- [ ] La CI ripete questi controlli: se un check nuovo entra nella bar, va aggiunto anche in `ci.yml`.
- [ ] DB irraggiungibile o vuoto: `/` e `/casa-rossa` rispondono **404** (mai 500) e la build completa comunque.
- [ ] UI toccata: verificata nel preview a 375px con almeno una misura oggettiva; niente scroll orizzontale (`scrollWidth <= innerWidth`).
- [ ] i18n toccata: con ES su un campo non tradotto si vede il testo EN, mai stringa vuota.
- [ ] Admin toccato: login reale nel preview (credenziali dall'utente), salvataggio eseguito e dato riletto; valore di test ripristinato prima di chiudere.
- [ ] `git status --short` vuoto a fine lavoro; se lo stato di una fase è cambiato, sezione 7 aggiornata nello stesso giro di commit.

---

## 6. Flusso di lavoro

**`main` è protetto** (ruleset GitHub: PR obbligatoria + check `verifica` verde, nessun bypass). Ogni modifica: branch → commit → push → PR → CI verde → merge (autonomo, vedi sezione 3).

1. **Branch per fase** (`fase-N-descrizione`) o per argomento (`docs/…`, `fix/…`).
2. **Ordine dei commit**: prima l'SQL (se c'è), poi il codice, poi i docs — ognuno autonomo con build verde.
3. **Verifica end-to-end quando possibile**: preview → login → azione reale → misura → ripristino. Se il preview non parte, dichiara cosa NON hai verificato.
4. **Passi manuali** per l'utente: numerati a fine risposta, con comandi/SQL pronti da incollare.
5. **CLAUDE.md è il registro operativo**: aggiornalo quando cambiano architettura, convenzioni o stato fasi — non per ogni fix (la storia sta in git). Tienilo sotto le 200 righe.

---

## 7. Roadmap e stato

| Fase | Contenuto | Stato |
|---|---|---|
| 1–3 | MVP statico + PWA + Supabase (schema/RLS) + auth titolare + pannello admin + editor tema | ✅ completate e applicate |
| 4 | Multi-tenancy: QR + scheda A6 ✅ (2026-07-09); **resta la landing su `/`** (valore del prodotto, demo, CTA — niente elenco pubblico strutture) | ◐ |
| 5 | PWA avanzata: manifest+SW fatti; **resta il test offline reale su iPhone/Android** (prima visita → aereo → lettura → ritorno online) | ◐ |
| 6 | Rifinitura: loading states, indicatore feedback non letti, pochi test e2e (guest, login, salvataggio, feedback, QR), analytics leggero senza PII (solo scansioni QR / aperture / feedback) | ⬜ |
| 7 | Test reale con QR in camera + primo cliente pilota | ⬜ |
| 8 | SaaS: registrazione self-service, Stripe, onboarding automatico | ⬜ (non anticipare) |

**Provisioning titolare (finché non c'è la Fase 8):** utente creato a mano in Authentication → Users, poi `update public.bnb_clients set owner_id = '<uuid>' where id = '<slug>';`. Istruzioni complete in fondo a `phase-3-auth.sql`.

**Migrazioni**: tutti gli script in `supabase/` sono applicati in produzione (verificato 2026-07-10). Per ogni script nuovo vale l'ordine: applicato in Supabase → verificato → push.

**Dominio**: `albeaconcierge.it` su Vercel (2026-07-10). `www` via CNAME `cname.vercel-dns.com`; apex via record A (su Register.it il nome del record è `albeaconcierge.it`, non `@.albeaconcierge.it`).

---

## 8. Registro decisioni (il perché delle scelte)

- **Una tabella `bnb_clients` con jsonb** invece di tabelle per wifi/regole/trasporti: meno join, editing granulare rimandato a quando servirà.
- **`id` = slug testuale** (es. `casa-rossa`): è l'URL del QR; niente uuid per le strutture.
- **ISR 300s invece di SSR**: le pagine ospite reggono da CDN e sopravvivono a Supabase spento; freschezza garantita da `revalidatePath` dopo ogni salvataggio.
- **Tema come CSS variables iniettate** (non classi condizionali): il tema arriva dal DB a runtime, i componenti non sanno nulla dei colori. 8 colori, 5 opzionali (assente = default palette).
- **Guardia contrasto per tipo di testo** (`theme-preview.tsx`): soglia 4.5 per testo di lettura, 3 per testo grande su colore; il tema di fabbrica non viene segnalato; la coppia del micro-badge accento è esclusa (decorativa). Pulsante "Colori base" = reset locale agli 8 default.
- **Feedback ospiti solo-scrittura**: anon può inserire ma MAI leggere; server action guest col client anon + rate limit LRU in-memory (5/10min per IP+struttura, 30/h per struttura) + honeypot + regola WAF Vercel sui POST guest (specifica in `docs/`). Se si aggiunge un'altra server action pubblica alle pagine guest, rivalutare la regola WAF.
- **Riordino posti atomico**: funzione SQL `reorder_places` (valida la permutazione, unica UPDATE, lock sulla riga padre, `security invoker`, EXECUTE revocato a PUBLIC) chiamata via `rpc`; client ottimistico (l'ordine completo vince, rollback su errore).
- **Storage per-cartella**: bucket pubblico `bnb-images`, percorsi `<slug>/<tipo>-<timestamp>`, policy su `(storage.foldername(objects.name))[1]`. Nome file sempre nuovo: mai combattere la cache CDN con l'upsert.
- **Immagini posti con `<img>` + fallback emoji su `onError`** (non `next/image`): nessun URL esterno può rompere la guest.
- **URL validati server-side** (`url-validation.ts`): host Google veri (no substring) per recensioni/Maps; https o path relativo per le immagini. Colori tema validati `#rrggbb` in `updateBnbGeneral`.
- **QR generato nel browser** con `window.location.origin`, colori fissi nero/bianco (un QR a basso contrasto non si scansiona). Attenzione: stampato da una preview Vercel codificherebbe l'URL sbagliato.
- **Meteo client-side** (Open-Meteo, gratis, no key): le pagine restano statiche; coordinate fisse su Roma; su errore placeholder discreto.
- **Manifest/chrome PWA**: colori statici da `brand.ts` (il manifest è unico per l'app, non per-tenant); SW network-first, esclude `/admin` dalla cache.
- **Stack**: Next.js 16 (App Router, Turbopack), Tailwind v4, shadcn/ui (base-nova, lucide), sonner, `qrcode`.

---

## 9. Debiti tecnici e backlog

**Debiti correnti (in ordine di rischio):**
1. Contrasto del badge ZTL/accento (~2.3:1): valutato col proprietario (2026-07-10), resta così per scelta.
2. `walkingDistance` non localizzato (per scelta: valore neutro + suffisso localizzato lato UI).
3. Meteo su Roma fissa: per il multi-città servirà lat/lon per-struttura nel DB.

**Backlog (non anticipare senza richiesta, salvo tecnicismi che il proprietario non può valutare):**
1. `next/image` con `remotePattern` mirato al progetto Supabase per le immagini di Storage (il `<img>` con fallback resta per gli URL esterni).
2. Pulizia immagini orfane nel bucket (ogni upload crea un file nuovo; serve elenco per cartella + cestino nell'admin).
3. QR/stampa: URL pubblico esplicito o stampa disabilitata fuori produzione.

---

## 10. Collaborazione Claude Code + Codex

Claude Code è l'ambiente principale (implementa); Codex fa review indipendente e QA tramite il plugin `codex` già installato. Regole: un solo agente scrive alla volta; `/codex:review --base main` per il review normale, `/codex:adversarial-review` prima di merge rischiosi (PWA/cache, RLS/auth, migrazioni SQL, race); `/codex:rescue` solo su branch/worktree separato; niente review gate automatico di default. CLAUDE.md resta la fonte di verità: ogni agente lo legge prima di pianificare o implementare.
