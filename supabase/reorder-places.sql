-- ============================================================================
-- Concierge Digitale — riordino posti ATOMICO (review Codex #3)
-- ============================================================================
-- Da eseguire nell'SQL Editor di Supabase DOPO schema.sql e phase-3-auth.sql.
-- Idempotente (create or replace + grant ripetibile): si può rieseguire.
--
-- Prima il riordino avveniva con N update paralleli lato app: una lista
-- manipolata (parziale o con duplicati) poteva riscrivere sort_order in modo
-- incoerente, e se un update falliva a metà l'ordine restava spezzato.
--
-- Questa funzione fa tutto in UNA transazione (una funzione plpgsql è
-- atomica: o tutte le righe cambiano, o nessuna) e PRIMA valida che la lista
-- ricevuta sia esattamente una permutazione dei posti della struttura:
--   • stessa cardinalità dei posti a DB,
--   • nessun id duplicato,
--   • ogni id appartiene davvero alla struttura.
-- Qualsiasi scostamento solleva un'eccezione → nessuna scrittura parziale.
--
-- `security invoker` (default): gira col ruolo del chiamante, quindi la RLS
-- della Fase 3 continua ad applicarsi. In più c'è un controllo esplicito di
-- proprietà (difesa in profondità, come le server action che fanno
-- getOwnedBnb prima di scrivere).
--
-- Concorrenza: la riga di bnb_clients viene bloccata con `for update` PRIMA
-- di contare i posti, non solo per il controllo di proprietà. Questo serializza
-- due riordini concorrenti sulla STESSA struttura (il secondo aspetta che il
-- primo finisca la transazione, niente interleaving tra "conta" e "scrivi") e,
-- grazie al lock che il vincolo FK di restaurants.bnb_client_id prende sulla
-- riga padre, blocca anche un INSERT concorrente di un nuovo posto finché
-- questa transazione non commit. Senza il lock, un posto potrebbe apparire
-- tra la validazione della permutazione e la UPDATE, senza però corrompere
-- nulla (l'UPDATE tocca solo gli id ricevuti) — il lock chiude comunque la
-- finestra invece di limitarsi a "non è grave".
-- ============================================================================

create or replace function public.reorder_places(
  p_bnb_id text,
  p_ordered_ids text[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_db_count       int;
  v_arg_count      int := coalesce(array_length(p_ordered_ids, 1), 0);
  v_distinct_count int;
begin
  -- Proprietà esplicita + lock: la riga del B&B viene bloccata qui, prima di
  -- contare i posti, e resta bloccata fino a fine transazione.
  perform 1 from public.bnb_clients b
    where b.id = p_bnb_id and b.owner_id = auth.uid()
    for update;
  if not found then
    raise exception 'reorder_places: struttura inesistente o non posseduta'
      using errcode = 'check_violation';
  end if;

  -- Quanti posti ha davvero la struttura, quanti id distinti sono arrivati.
  select count(*) into v_db_count
    from public.restaurants where bnb_client_id = p_bnb_id;
  select count(distinct oid) into v_distinct_count
    from unnest(p_ordered_ids) as oid;

  -- Deve essere ESATTAMENTE una permutazione: stessa cardinalità, nessun
  -- duplicato, ogni id appartiene alla struttura. Altrimenti si annulla tutto.
  if v_arg_count <> v_db_count
     or v_distinct_count <> v_arg_count
     or exists (
       select 1 from unnest(p_ordered_ids) as oid
       where not exists (
         select 1 from public.restaurants r
         where r.id = oid and r.bnb_client_id = p_bnb_id
       )
     )
  then
    raise exception
      'reorder_places: lista non permutazione (attesi %, ricevuti %, distinti %)',
      v_db_count, v_arg_count, v_distinct_count
      using errcode = 'check_violation';
  end if;

  -- Riordino atomico: sort_order = posizione 0-based nell'array.
  update public.restaurants r
    set sort_order = pos.ord - 1
  from (
    select oid, ordinality as ord
    from unnest(p_ordered_ids) with ordinality as t(oid, ordinality)
  ) pos
  where r.id = pos.oid and r.bnb_client_id = p_bnb_id;
end;
$$;

-- Postgres concede EXECUTE a PUBLIC per default su ogni funzione nuova: il solo
-- grant qui sotto NON lo toglie. Il controllo di proprietà dentro la funzione
-- impedisce già scritture da anon (non ha owner_id da far combaciare), quindi
-- non è una falla diretta — ma lasciare la funzione invocabile da chiunque è
-- superficie inutile. Revoca esplicita, poi grant solo a chi serve.
revoke execute on function public.reorder_places(text, text[]) from public;
grant execute on function public.reorder_places(text, text[]) to authenticated;
