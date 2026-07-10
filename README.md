# Concierge Digitale

Micro SaaS per B&B/affittacamere di Roma: l'ospite scansiona un QR e apre la guida della struttura (Wi-Fi, regole della casa, trasporti, posti consigliati); il titolare gestisce i contenuti da un pannello admin protetto.

PWA mobile-first, dati su [Supabase](https://supabase.com), deploy su [Vercel](https://vercel.com). `main` è produzione: ogni push su questo branch deploya automaticamente.

Il manuale operativo completo (architettura, convenzioni, stato delle fasi, debiti tecnici) è in [`CLAUDE.md`](./CLAUDE.md).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) (Postgres, Auth, Storage, RLS)
- PWA con service worker (solo build di produzione)

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Servono le variabili d'ambiente Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in un file `.env.local` (non versionato).

## Comandi

```bash
npm run dev        # server di sviluppo
npm run build      # build di produzione
npm run start      # avvia la build di produzione (serve per testare PWA/service worker)
npm run lint       # ESLint, zero warning
npm run test:sql   # test degli script SQL su PGlite (schema, RLS, funzioni)
npm run test:unit  # test unitari (rate limiter, validazione URL)
```

La CI (`.github/workflows/ci.yml`) esegue typecheck, lint, entrambe le suite di test e la build a ogni push e pull request.

## Database

Le migrazioni SQL vivono in `supabase/` e si applicano a mano nell'SQL Editor di Supabase (nessuna chiave di servizio nel codice, solo la anon key). Ogni file è pensato per essere rieseguibile senza danni. L'elenco di cosa è già applicato in produzione è in `CLAUDE.md`, sezione 7.
