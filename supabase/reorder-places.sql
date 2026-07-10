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
  -- Proprietà esplicita: la struttura deve essere del titolare loggato.
  if not exists (
    select 1 from public.bnb_clients b
    where b.id = p_bnb_id and b.owner_id = auth.uid()
  ) then
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

grant execute on function public.reorder_places(text, text[]) to authenticated;
