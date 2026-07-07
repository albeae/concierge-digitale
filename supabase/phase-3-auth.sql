-- ============================================================================
-- Concierge Digitale — Fase 3: policy di scrittura per il titolare + link owner
-- ============================================================================
-- Da eseguire nell'SQL Editor di Supabase DOPO supabase/schema.sql (Fase 2).
--
-- Aggiunge le policy RLS che permettono al TITOLARE autenticato di modificare
-- SOLO la propria struttura e i propri posti. La lettura pubblica (anon) resta
-- invariata (policy della Fase 2): gli ospiti continuano a leggere senza login.
--
-- Provisioning manuale del titolare (una volta sola, vedi in fondo):
--   1. Crea l'utente in Authentication → Users → Add user (email + password).
--   2. Collega l'utente alla struttura valorizzando owner_id (SQL in fondo).
-- Non c'è registrazione pubblica: il signup self-service arriva in Fase 8.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- bnb_clients: il titolare può AGGIORNARE (non creare/cancellare) la riga di
-- cui è proprietario. La `with check` con la stessa condizione impedisce di
-- riassegnare la struttura a un altro owner_id.
-- ----------------------------------------------------------------------------
create policy "Titolare aggiorna la propria struttura"
  on public.bnb_clients
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- restaurants: il titolare ha pieno CRUD sui posti della propria struttura.
-- `for all` copre insert/update/delete; la `using`/`with check` verifica che
-- il posto appartenga a un B&B di sua proprietà. La lettura pubblica resta
-- garantita dalla policy select della Fase 2 (le policy si sommano in OR).
-- ----------------------------------------------------------------------------
create policy "Titolare gestisce i posti della propria struttura"
  on public.restaurants
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.bnb_clients b
      where b.id = restaurants.bnb_client_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.bnb_clients b
      where b.id = restaurants.bnb_client_id
        and b.owner_id = auth.uid()
    )
  );

commit;

-- ============================================================================
-- PASSO MANUALE — collega il titolare alla struttura (una volta sola)
-- ============================================================================
-- Dopo aver creato l'utente in Authentication → Users, recupera il suo UUID
-- (colonna "User UID") e lancia, sostituendo il valore:
--
--   update public.bnb_clients
--   set owner_id = '00000000-0000-0000-0000-000000000000'  -- <-- UUID utente
--   where id = 'casa-rossa';
--
-- Da quel momento, facendo login con quell'email su /admin, il titolare può
-- modificare Casa Rossa e i suoi posti (e nient'altro).
-- ============================================================================
