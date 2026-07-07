@AGENTS.md

# Concierge Digitale — Piano di progetto per l'MVP

Micro SaaS per B&B/affittacamere di Roma. PWA mobile-first via QR Code, dati gestiti su Supabase, deploy su Vercel.

---

## 0. Principio guida: parti piccolo, poi generalizza

Con zero esperienza, l'errore più comune è voler costruire subito il "SaaS completo" (multi-tenant, pagamenti, onboarding automatico). Non farlo. Il piano sotto è ordinato così:

1. **Prima**: un'app funzionante per **un solo B&B** (magari il tuo, o un amico disposto a fare da tester), dati anche inseriti a mano su Supabase.
2. **Poi**: generalizzi a multi-tenant (più B&B sulla stessa app).
3. **Solo alla fine**: pannello di abbonamento/pagamento per vendere il prodotto ad altri.

Questo ti fa validare l'idea con un cliente reale prima di investire tempo nell'infrastruttura SaaS completa.

---

## 1. Strumenti da preparare (Fase 0 — setup, ~1 giorno)

| Cosa | A cosa serve | Note |
|---|---|---|
| Account [GitHub](https://github.com) | Versionare il codice | Gratuito |
| Account [Vercel](https://vercel.com) | Hosting/deploy | Collegalo a GitHub |
| Account [Supabase](https://supabase.com) | Database + autenticazione | Piano gratuito sufficiente per l'MVP |
| Node.js (versione LTS) | Eseguire il progetto in locale | Scarica da nodejs.org |
| Un editor di codice | Scrivere/leggere il codice | VS Code è lo standard |
| **Claude Code** | Scrivere il codice per te | Vedi sezione 8 — è lo strumento chiave data la tua situazione |

Non serve altro per iniziare. Niente Figma, niente corsi propedeutici: si impara facendo, con Claude che scrive il codice e ti spiega cosa fa.

---

## 2. Stack tecnico consigliato

- **Frontend**: **Next.js** (framework React) — è quello con il supporto migliore su Vercel e con plugin pronti per trasformarlo in PWA.
- **Stile**: **Tailwind CSS** + **shadcn/ui** — componenti già pronti (bottoni, card, form) esteticamente puliti, così non devi "disegnare" da zero.
- **Database**: **Supabase** (Postgres) — con autenticazione integrata per il login dei titolari B&B, storage per loghi/immagini, e **Row Level Security (RLS)** per garantire che ogni titolare veda solo i propri dati.
- **PWA**: manifest + service worker (libreria `next-pwa` o Workbox) per installabilità e funzionamento offline parziale.
- **Deploy**: Vercel, collegato al repository GitHub — ogni `git push` pubblica automaticamente.

---

## 3. Progettazione del database (Supabase)

Questa è la parte concettualmente più importante: se lo schema è fatto bene, il resto scorre.

### Tabelle principali

> **Schema implementato in Fase 2**: l'SQL completo (tabelle + RLS + seed) è in
> **`supabase/schema.sql`**, da eseguire nell'SQL Editor di Supabase. La vecchia
> tabella `properties` + le tabelle `wifi_info` / `house_rules` /
> `transport_info` separate sono state sostituite da un'unica tabella
> **`bnb_clients`** con colonne `jsonb`, più `restaurants` per i posti.

**`bnb_clients`** (una riga per ogni B&B — è il "cliente" del SaaS)
- `id` (testo, slug usato nell'URL — es. `casa-rossa`, `villa-borghese`)
- `name`
- `owner_id` (uuid **nullable**, FK verso `auth.users`. **Non univoco**: più righe possono condividere lo stesso `owner_id`, così un titolare potrà gestire più strutture senza cambiare schema. `NULL` finché non c'è il login: si valorizza in Fase 3 con Supabase Auth)
- `theme` (jsonb: `primaryColor`, `secondaryColor`, `backgroundColor`, `logoUrl`, `heroImage`)
- `toggles` (jsonb: `hasKitchen`, `hasParking`, `offersBreakfast`)
- `content` (jsonb bilingue `{ it, en, es? }`: `welcomeMessage`, `wifiNetworkName`, `wifiPassword`, `checkIn`, `checkOut`, `houseRules[]`)
- `location` (jsonb bilingue `{ it, en, es? }`: `airport`, `train`, `ztl`)
- `address` (testo, indirizzo "neutro" per l'embed della mappa in Info)
- `host_phone` / `host_whatsapp` (testo, contatti host per i bottoni `tel:` / `wa.me`)
- `created_at`

Wi-Fi, regole della casa e trasporti vivono **dentro** i jsonb `content`/`location`: niente tabelle dedicate finché non serve un editing granulare (in quel caso si potranno estrarre `house_rules` / `transport_info` con FK `bnb_client_id`).

**`restaurants`** (posti consigliati — tabella separata, FK verso il B&B)
- `id` (testo; default `gen_random_uuid()::text`, il seed usa gli id parlanti del mock)
- `bnb_client_id` (FK → `bnb_clients.id`, `on delete cascade`)
- `category` (`ristorante` | `bar` | `servizio`, con `check` constraint)
- `name` (jsonb `{ it, en }`)
- `description` (jsonb `{ it, en, es }` — la citazione/raccomandazione dell'host)
- `walking_distance` (es. `"5 min"`; il suffisso "a piedi/walk" è localizzato lato UI)
- `image_url`
- `google_maps_url`
- `sort_order` (intero: ordine di presentazione nella lista, il DB da solo non garantirebbe un ordine stabile)
- `created_at`

**`users`** — gestita automaticamente da Supabase Auth (non la crei tu), collegata a `bnb_clients.owner_id`.

### Sicurezza: Row Level Security (RLS)

Fondamentale in un SaaS multi-tenant:
- Il **titolare** (autenticato) può leggere/scrivere **solo** le righe di `bnb_clients` dove `owner_id` è il suo, e i `restaurants` con `bnb_client_id` di sua proprietà.
- L'**ospite** (pubblico, senza login) può **solo leggere** — nessun accesso in scrittura.

**Stato attuale (Fase 2)**: RLS abilitata su entrambe le tabelle con una sola
policy `for select` per `anon`/`authenticated` (lettura pubblica). Nessuna
policy di scrittura = insert/update/delete negati a tutti via API: i dati si
modificano solo dal pannello Supabase. Le policy di scrittura per il titolare
(filtrate su `owner_id`) arrivano in **Fase 3** con Supabase Auth.

---

## 4. Design senza esperienza di design

Non ti serve Figma per l'MVP. Il modo più efficiente con le tue risorse:

1. **Definisci un moodboard minimo a parole** (non serve disegnarlo): es. "palette calda, terracotta/ocra, richiami a Roma, font sans-serif pulito, bottoni grandi per uso da smartphone in mano".
2. **Fai generare l'interfaccia direttamente in codice** da Claude (qui in chat o in Claude Code) usando Tailwind + shadcn/ui, e poi la correggi a parole: "rendi i bottoni più arrotondati", "usa toni più caldi", "il testo è troppo piccolo per un turista senza occhiali".
3. Principi da rispettare data la tua utenza (turisti, spesso stanchi, con poco tempo, magari senza dati mobili):
   - Font grandi, alto contrasto, tocco facile (bottoni grandi).
   - Zero fronzoli: password Wi-Fi e regole della casa devono essere visibili **entro un tap** dall'apertura.
   - Funzionamento offline per le informazioni essenziali (vedi sezione PWA).

Se in futuro vuoi alzare il livello estetico, puoi sempre chiedermi mockup visivi qui in chat prima di implementarli.

---

## 5. Roadmap di sviluppo (fasi pratiche)

### Fase 1 — MVP statico a singola property (senza database) — ✅ completata
Obiettivo: vedere e toccare con mano l'app su telefono, con dati finti scritti direttamente nel codice.
- Homepage ospite: Wi-Fi, regole della casa, trasporti, ristoranti.
- Nessun login, nessun database ancora.
- ✅ **Deployata su Vercel**: repo GitHub `albeae/concierge-digitale`, live su `concierge-digitale.vercel.app`. Deploy automatico a ogni `git push` su `main`. Manca ancora il test dal telefono reale via QR.

### Fase 2 — Collegamento a Supabase — ✅ completata (lato codice)
- ✅ Schema + RLS + seed scritti in **`supabase/schema.sql`** (da eseguire una volta nell'SQL Editor di Supabase — con la sola anon key il codice non può creare tabelle).
- ✅ Frontend che legge da Supabase invece che dal codice: `src/lib/supabase.ts` (client) + `src/lib/data.ts` (query async), `src/lib/mock-data.ts` eliminato.
- ⏳ **Passo manuale rimasto**: eseguire `supabase/schema.sql` nell'SQL Editor del progetto Supabase; finché non è fatto, l'app risponde 404 (senza rompersi) e si auto-ripara entro ~5 minuti grazie all'ISR.

### Fase 3 — Pannello admin per il titolare
- Pagina di login (Supabase Auth: email + password).
- Form per inserire/modificare Wi-Fi, regole, trasporti, ristoranti.
- Da questo momento **il titolare inserisce da solo i propri dati**, senza che tu debba intervenire sul database.

### Fase 4 — Multi-tenancy
- Routing dinamico: `tuosito.it/[slug]` mostra i dati della property corrispondente.
- Generazione del QR Code per ogni property (libreria `qrcode`, oppure un tool online gratuito, puntando all'URL con lo slug).

### Fase 5 — Funzionalità PWA vera e propria
- `manifest.json` (nome, icone, colore tema) → l'ospite può "installare" l'app sulla home del telefono.
- Service worker → le info essenziali restano visibili anche senza connessione dopo la prima visita (utile in camera con Wi-Fi che si disconnette).

### Fase 6 — Rifinitura
- Stati di caricamento, messaggi di errore comprensibili.
- Eventuale analytics leggero (es. Vercel Analytics) per mostrare al titolare B&B quante persone hanno visitato la pagina — è un ottimo argomento di vendita.

### Fase 7 — Test reale e primo cliente pilota
- Stampa il QR, mettilo in una camera vera, testa con ospiti reali.
- Raccogli feedback, correggi.

### Fase 8 — Livello SaaS (dopo la validazione)
- Pagina di registrazione self-service per nuovi B&B.
- Pagamenti ricorrenti (Stripe) per l'abbonamento mensile.
- Onboarding automatico (creazione property + slug + QR generato in automatico).

---

## 6. Cosa scansiona davvero l'ospite

Il QR Code non è "intelligente": è solo un'immagine che codifica un URL, es.:
```
https://tuoconcierge.it/casa-rossa
```
Quando l'ospite lo scansiona, il telefono apre quell'indirizzo nel browser (o nella PWA se già installata), che a sua volta interroga Supabase per i dati di `casa-rossa` e li mostra. Tutta la "magia" è nel routing dinamico lato Next.js + nella query a Supabase filtrata per slug.

---

## 7. Modello di business (per quando generalizzi)

Qualche domanda a cui converrà rispondere prima della Fase 8:
- Prezzo per B&B (abbonamento mensile fisso? scalabile per numero di camere?).
- Chi genera/stampa il QR: tu o il titolare in autonomia dal pannello?
- Serve un dominio/sottodominio per B&B (es. `casa-rossa.tuoconcierge.it`) o basta un path (`tuoconcierge.it/casa-rossa`)? Il path è molto più semplice da gestire con Vercel.

---

## 8. Come useresti concretamente Claude in questo progetto

Dato che non hai esperienza di programmazione, il modo più efficace per costruire davvero il codice è **Claude Code** (l'app agentica di Anthropic per sviluppatori): scrive, testa e corregge i file del progetto per te, lavorando direttamente sui file sul tuo computer o collegato a GitHub. In questa chat invece puoi:
- Fare pianificazione, come stiamo facendo ora.
- Progettare schema database e wireframe testuali.
- Farmi rivedere pezzi di codice o dubbi puntuali.

Il flusso pratico consigliato: apri Claude Code nella cartella del progetto e gli chiedi, fase per fase, di implementare esattamente i punti della roadmap sopra (es. "crea un progetto Next.js con Tailwind e shadcn/ui, poi implementa la homepage ospite descritta nella sezione 4"). Procedi una fase alla volta, testando ogni passaggio prima di andare avanti.

---

## 9. Decisioni prese finora (stato dell'implementazione)

Registro delle scelte già implementate nel codice (Fase 1 + Fase 2).

### Stack e struttura
- **Next.js 16** (App Router, TypeScript, Turbopack) + **Tailwind CSS v4** + **shadcn/ui** (stile base-nova, icone lucide).
- Cartelle: `src/app`, `src/components`, `src/lib` (dati + i18n), `src/types` (tipi di dominio).
- PWA: `manifest.webmanifest`, service worker (`public/sw.js`, solo in produzione), icone installabili. Il SW (`concierge-v2`) precarica lo shell dell'app e usa **network-first con fallback offline** per le pagine e **stale-while-revalidate** per gli asset: dopo la prima visita, Wi-Fi/regole/contatti restano visibili anche offline (verificabile solo in produzione, non nella preview dev).

### Routing dinamico
- La pagina ospite è **`app/[bnbId]/page.tsx`** (server component): legge lo slug, cerca il B&B, `notFound()` se non esiste, `generateStaticParams` per pre-generare le pagine.
- `app/page.tsx` (root) **reindirizza** al primo B&B (Fase 1 = singola struttura). In futuro qui può stare una landing o l'elenco strutture.
- URL ospite = `tuodominio/[slug]` (es. `/casa-rossa`), lo stesso che finisce nel QR Code.

### 3 tab (bottom navigation)
Navigazione a tab lato client (stato in `BnbGuide`), barra fissa in basso stile app (icone lucide). Header sticky con **logo** (`theme.logoUrl`), nome del B&B e **toggle lingua IT/EN**.

**Home** (`home-tab.tsx`), in quest'ordine:
1. Messaggio di benvenuto (`content[lang].welcomeMessage`)
2. **Hero image** arrotondata (`theme.heroImage` → illustrazione `public/hero-trastevere.svg`)
3. Due widget affiancati: **meteo Roma** (finto) + **ora locale** (orologio reale `Europe/Rome`) — `home-widgets.tsx`
4. **Card Wi-Fi** in evidenza: password grande, "Copia" → clipboard + **toast "Copiato!"** (`wifi-card.tsx`)
5. Due bottoni rapidi **WhatsApp Host** / **Chiama** (link placeholder `wa.me` / `tel:`) — `quick-actions.tsx`
6. **Modulo recensione** 5 stelle (`review-module.tsx`): 1-3 → form feedback interno + toast; 4-5 → redirect Google Reviews (placeholder)
7. Anteprima **"Dove mangiare"** (primi 3 posti food + "Vedi tutti" → Esplora)

**Esplora** (`explore-tab.tsx`) — feed completo dei posti con **filtri per categoria** (Tutti / Ristoranti / Bar / Servizi).

**Info** (`info-tab.tsx`), lista verticale di card:
0. Card **Emergenze** (`emergency-card.tsx`) in cima: 112 (numero unico europeo), chiama host, e **farmacia più vicina** ricavata dai posti (`servizio` il cui nome contiene "farmacia/pharmacy"). Accento rosso dal token `--destructive`. I contatti host arrivano dal database come prop (`bnb.hostPhone`/`bnb.hostWhatsapp`, usati anche dalle azioni rapide Home); in `src/lib/contacts.ts` restano il 112 e gli helper `telUrl`/`whatsappUrl`.
1. Card **Check-in / Check-out** (`content.checkIn` / `content.checkOut`)
2. Card **Regole + Raccolta differenziata** (`rules-card.tsx`): regole da `houseRules` + 5 cestini con colori standard Roma/AMA
3. Card **servizi** (`Cucina` / `Parcheggio` / `Colazione`): renderizzate **solo se il relativo toggle è true** (rendering condizionale, non nascondere via CSS)
4. **Location & Trasporti**: embed **Google Maps** (`map-embed.tsx`, indirizzo placeholder) + 3 blocchi **"In Aereo / In Treno / In Auto"** (`transport-blocks.tsx`), con **"In Auto" evidenziato** (anello ocra + badge) per la ZTL di Roma
5. Card **Contatti**

### Toast e clipboard
- Toast via **sonner** (`components/ui/sonner.tsx`, riscritto senza `next-themes`; `<Toaster/>` montato in `BnbGuide`). Usato da Wi-Fi (copia) e recensione.
- La copia Wi-Fi usa `navigator.clipboard` + toast: funziona su device reale; nella preview headless il clipboard è bloccato (`NotAllowedError`).

### Contenuti multilingue (it/en/es) con fallback su `en`
- Lingue supportate: **IT / EN / ES** (toggle in alto). Aggiungere una lingua = aggiungere un valore a `Locale`, un blocco a `ui` (`i18n.ts`) e i contenuti in `mock-data.ts`.
- Il tipo `Localized<T>` (`src/types/index.ts`) è `{ en: T } & Partial<Record<Locale, T>>`: **l'inglese è sempre presente ed è la base del fallback**, le altre lingue sono opzionali. Così si può aggiungere una lingua *a poco a poco* senza tradurre subito ogni campo.
- **Fallback su `en`** (`src/lib/localize.ts`): `resolveLocalized(content/location, locale)` fa il fallback **per-chiave**; `pick(text, locale)` fa lo stesso per i testi dei posti. Nei posti (`mock-data.ts`), il **nome** resta volutamente `{it,en}` (nome proprio, in ES ripiega su EN), mentre la **descrizione** ha anche la traduzione `es` per tutti i 7 posti.
- L'attributo `lang` dell'`<html>` viene allineato alla lingua scelta (effetto in `bnb-guide.tsx`) per gli screen reader.

### Tema dinamico via CSS variables (ThemeProvider)
- Il componente **`ThemeProvider`** (`src/components/theme-provider.tsx`) legge `theme` dei dati e inietta le **CSS custom properties** (`--primary`, `--terracotta`, `--terracotta-strong` via `color-mix`, `--ochre`, `--background`) su un wrapper.
- I componenti usano solo le utility Tailwind mappate su quelle variabili (`bg-terracotta`, `text-terracotta`, `bg-background`…), **mai colori fissi**: così ogni B&B mostra automaticamente la propria palette. Default "Casa Rossa": terracotta/ocra/crema.

### Design token centralizzati (niente valori "arbitrary" nei componenti)
Regola: **nessun colore/ombra/raggio scritto a mano** nel markup; tutto deriva da un token. Verificato con scansione su tutto `src`.
- **Ombre** → 4 token in `@theme` di `globals.css`: `--shadow-soft` (card/mappa), `--shadow-raised` (hero), `--shadow-header` (header), `--shadow-brand` (Wi-Fi, ombra colorata terracotta). I componenti usano le utility `shadow-soft/raised/header/brand`, non più `shadow-[...]` ripetuti.
- **Testo/superfici su primario** → utility `text-primary-foreground` / `bg-primary-foreground` (mappate su `--primary-foreground`), **non** `text-white`/`bg-white`: così il contrasto resta corretto anche se un B&B sceglie una `primaryColor` chiara. (Unica eccezione volutamente `text-white`: le icone dei cestini, che stanno sopra i colori-dominio AMA, non su una superficie di tema.)
- **Raggi** → sempre la scala nominale (`rounded-xl/2xl/3xl/4xl/full`), che in `@theme` deriva da `--radius`. Niente raggi in pixel.
- **Colore chrome del prodotto** (`theme_color`/`background_color` del manifest, `themeColor` del viewport) → fonte unica in **`src/lib/brand.ts`** (`BRAND.primary`/`BRAND.background`), importata da `manifest.ts` e `layout.tsx`: non più esadecimali ricopiati a mano. È il default statico dell'app (il manifest è unico, non per-tenant); la palette per-struttura resta nel `theme` dei dati.
- **Colori cestini AMA** → costanti di dominio in **`src/lib/recycling.ts`** (`RECYCLING_BINS`), non più hardcoded dentro `rules-card.tsx`; le etichette bilingui restano in `i18n.ts`.

### Estetica "app nativa iOS"
- Card con `rounded-3xl`, **ombre morbide** (niente bordi netti/ring), tanto respiro tra le sezioni. Base modificata in `src/components/ui/card.tsx`.
- Navigazione a tab con barra fissa in basso; header e nav con ombra soft.

### Fase 2 — dati da Supabase
- **Schema SQL versionato** in `supabase/schema.sql` (tabelle + RLS + seed di Casa Rossa con i 7 posti, identico ai vecchi mock): si applica a mano nell'SQL Editor di Supabase, perché l'app ha solo la **anon key** (che grazie alla RLS può solo leggere). Il file è rieseguibile senza duplicare il seed (`on conflict do nothing`).
- **Client**: `src/lib/supabase.ts` — un solo `createClient` condiviso, env `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in `.env.local` e su Vercel); lancia un errore chiaro se mancano.
- **Data layer**: `src/lib/data.ts` — `getBnb` / `getBnbIds` / `getPlaces` ora **async** su Supabase, stesse firme di prima (i server component fanno `await`). Mappano snake_case → camelCase; i jsonb hanno già la forma dei tipi di dominio. Ogni funzione è avvolta in `cache()` di React (una query sola per richiesta anche se chiamata da `generateMetadata` + pagina). `src/lib/mock-data.ts` **eliminato**.
- **Errori senza crash**: se il DB non risponde o lo schema non è ancora applicato, il data layer logga e restituisce vuoto → la pagina fa `notFound()` (404), la build **non** fallisce.
- **ISR**: `export const revalidate = 300` su `app/page.tsx` e `app/[bnbId]/page.tsx` — le pagine restano statiche/CDN ma si rigenerano al massimo ogni 5 minuti, quindi le modifiche fatte a mano su Supabase compaiono senza redeploy. `generateStaticParams` ora legge gli slug dal DB; gli slug creati dopo la build vengono comunque serviti alla prima richiesta (`dynamicParams` default).
- **Campi nuovi collegati**: `address` (mappa + riga indirizzo in Info), `host_phone` / `host_whatsapp` (bottoni rapidi Home, card Emergenze e card Contatti) viaggiano su `Bnb` (`address`, `hostPhone`, `hostWhatsapp`) e arrivano ai componenti come prop; in `src/lib/contacts.ts` restano solo il 112 e gli helper `telUrl`/`whatsappUrl`. La card **Contatti** (Info) ora mostra righe tappabili WhatsApp/telefono reali invece del solo testo generico.

### Note / debiti tecnici da sistemare più avanti
- ⚠️ **Il feedback 1-3 stelle si perde** (debito noto, lasciato volutamente anche in Fase 2): `review-module.tsx` → `handleSubmit` mostra solo il toast "Grazie!" e scarta il testo (`setFeedback("")`), senza salvarlo o inviarlo da nessuna parte. Ora che c'è Supabase si potrà risolvere con una tabella `guest_feedback` (+ policy di insert per `anon`) — nel frattempo **non affidarsi a questo canale** per raccogliere lamentele reali degli ospiti. Le recensioni 4-5 stelle invece funzionano già (redirect a Google Reviews, anche se con `placeid` placeholder).
- `walkingDistance` è un campo singolo (non `{it,en}`): valore neutro (es. "5 min") + suffisso localizzato lato UI.
- `imageUrl` dei **posti** è ancora vuoto → card con emoji di categoria come placeholder (l'hero invece usa già `theme.heroImage`). `next/image` è pronto; per foto da URL esterni servirà configurare `remotePatterns`.
- **Valori seed ancora finti nel database**: `address` ("Via della Lungaretta 42") e `host_phone`/`host_whatsapp` (`+390000000000`) di Casa Rossa sono i vecchi placeholder, ora **da aggiornare dal pannello Supabase** con i dati reali (il codice li legge già). Restano placeholder nel codice: link Google Reviews (`placeid`) e meteo del widget (serve un'API). L'ora locale è invece reale.
