-- ============================================================================
-- Concierge Digitale — Feedback privato degli ospiti (idea n. 1 del backlog)
-- ============================================================================
-- Da eseguire nell'SQL Editor di Supabase DOPO schema.sql e phase-3-auth.sql.
--
-- Risolve il debito tecnico n. 1: oggi il modulo recensioni mostra "Grazie!"
-- ma scarta il testo dei voti 1-3. Con questa tabella il feedback viene
-- salvato davvero e il titolare lo legge nel pannello admin.
--
-- Modello di accesso:
--   - L'ospite (anon) può SOLO inserire: nessuna lettura pubblica, così i
--     feedback restano privati tra ospite e titolare.
--   - Il titolare (authenticated) legge ed elimina SOLO i feedback delle
--     proprie strutture (stesso schema owner_id di phase-3-auth.sql).
--   - Nessun update: un feedback non si modifica, al massimo si elimina.
--
-- Il file è rieseguibile senza danni: `if not exists` sulle strutture e
-- guardie su pg_policies per le policy (che non supportano `if not exists`).
-- ============================================================================

begin;

create table if not exists public.guest_feedback (
  id uuid primary key default gen_random_uuid(),
  bnb_client_id text not null references public.bnb_clients (id) on delete cascade,
  -- Solo i voti "privati" (1-3): i voti 4-5 vengono mandati a Google Reviews
  -- dal frontend e non passano di qui.
  rating integer not null check (rating between 1 and 3),
  -- Il testo dell'ospite: mai vuoto, con un tetto per scoraggiare gli abusi
  -- (il client anon può scrivere senza login, meglio limitare).
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- L'admin legge i feedback di una struttura dal più recente: indice dedicato.
create index if not exists guest_feedback_bnb_created_idx
  on public.guest_feedback (bnb_client_id, created_at desc);

alter table public.guest_feedback enable row level security;

-- ----------------------------------------------------------------------------
-- Policy. `create policy` non ha `if not exists`, quindi ogni policy è
-- avvolta in una guardia su pg_policies: rieseguire il file non duplica nulla.
-- ----------------------------------------------------------------------------

-- L'ospite invia il feedback SENZA poterlo rileggere: solo insert, nessuna
-- select per anon (con RLS attiva, niente policy = lettura negata).
-- I vincoli sui valori (rating 1-3, testo non vuoto) li fa la tabella.
do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guest_feedback'
      and policyname = 'Ospite invia feedback (solo scrittura)'
  ) then
    create policy "Ospite invia feedback (solo scrittura)"
      on public.guest_feedback
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$guard$;

-- Il titolare legge i feedback delle proprie strutture.
do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guest_feedback'
      and policyname = 'Titolare legge i feedback delle proprie strutture'
  ) then
    create policy "Titolare legge i feedback delle proprie strutture"
      on public.guest_feedback
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.bnb_clients b
          where b.id = guest_feedback.bnb_client_id
            and b.owner_id = auth.uid()
        )
      );
  end if;
end
$guard$;

-- Il titolare può eliminare i feedback letti/gestiti (pulizia della lista).
do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guest_feedback'
      and policyname = 'Titolare elimina i feedback delle proprie strutture'
  ) then
    create policy "Titolare elimina i feedback delle proprie strutture"
      on public.guest_feedback
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.bnb_clients b
          where b.id = guest_feedback.bnb_client_id
            and b.owner_id = auth.uid()
        )
      );
  end if;
end
$guard$;

commit;
