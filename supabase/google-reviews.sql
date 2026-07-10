-- ============================================================================
-- Concierge Digitale — Link recensioni Google per-struttura (rifinitura)
-- ============================================================================
-- Da eseguire nell'SQL Editor di Supabase DOPO schema.sql.
--
-- Aggiunge la colonna `google_reviews_url` a bnb_clients: il link "lascia una
-- recensione su Google" della singola struttura, che sostituisce il segnaposto
-- fisso nel modulo recensioni. Vuoto = il modulo ringrazia soltanto, senza
-- aprire nulla (finché il titolare non lo imposta dal pannello).
--
-- Rieseguibile senza danni: `add column if not exists`.
-- ============================================================================

begin;

alter table public.bnb_clients
  add column if not exists google_reviews_url text not null default '';

commit;
