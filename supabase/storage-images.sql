-- ============================================================================
-- Concierge Digitale — Bucket immagini su Supabase Storage (idea n. 2)
-- ============================================================================
-- Da eseguire nell'SQL Editor di Supabase DOPO schema.sql e phase-3-auth.sql.
--
-- Crea il bucket pubblico `bnb-images` dove il pannello admin carica logo,
-- immagine hero e foto dei posti, al posto degli URL incollati a mano.
--
-- Convenzione dei percorsi: <slug-struttura>/<file>, es. casa-rossa/logo.webp.
-- Le policy usano la prima cartella del percorso per verificare che il
-- titolare stia scrivendo dentro una struttura DI SUA PROPRIETÀ (stesso
-- schema owner_id di phase-3-auth.sql).
--
-- Lettura: il bucket è `public`, quindi le immagini si servono dall'URL
-- pubblico del CDN di Supabase senza passare dalla RLS. Limiti difensivi sul
-- bucket: max 5 MB a file, solo formati immagine web (jpeg/png/webp).
--
-- Il file è rieseguibile senza danni: `on conflict do nothing` sul bucket e
-- guardie su pg_policies per le policy.
-- ============================================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bnb-images',
  'bnb-images',
  true,
  5242880, -- 5 MB: il pannello ridimensiona lato client, questo è il paracadute
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Policy su storage.objects (la RLS è già attiva di default su Supabase).
-- `create policy` non ha `if not exists`: guardie su pg_policies come negli
-- altri file, così rieseguire non duplica nulla.
-- ----------------------------------------------------------------------------

-- Il titolare carica immagini SOLO nella cartella di una sua struttura.
do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Titolare carica immagini della propria struttura'
  ) then
    create policy "Titolare carica immagini della propria struttura"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'bnb-images'
        -- objects.name QUALIFICATO: dentro la subquery un `name` nudo si
        -- legherebbe a bnb_clients.name (il nome del B&B), non al percorso
        -- del file — e la policy non funzionerebbe mai.
        and exists (
          select 1
          from public.bnb_clients b
          where b.id = (storage.foldername(objects.name))[1]
            and b.owner_id = auth.uid()
        )
      );
  end if;
end
$guard$;

-- Il titolare vede (via API) le immagini delle proprie strutture. Serve anche
-- per eliminare: un delete con `where` richiede la visibilità in select delle
-- righe, senza questa policy `.remove()` non troverebbe mai il file.
do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Titolare vede le immagini della propria struttura'
  ) then
    create policy "Titolare vede le immagini della propria struttura"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'bnb-images'
        -- objects.name qualificato: vedi il commento nella policy di insert.
        and exists (
          select 1
          from public.bnb_clients b
          where b.id = (storage.foldername(objects.name))[1]
            and b.owner_id = auth.uid()
        )
      );
  end if;
end
$guard$;

-- Il titolare può eliminare le immagini delle proprie strutture (pulizia,
-- sostituzione di un file caricato per errore).
do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Titolare elimina immagini della propria struttura'
  ) then
    create policy "Titolare elimina immagini della propria struttura"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'bnb-images'
        -- objects.name qualificato: vedi il commento nella policy di insert.
        and exists (
          select 1
          from public.bnb_clients b
          where b.id = (storage.foldername(objects.name))[1]
            and b.owner_id = auth.uid()
        )
      );
  end if;
end
$guard$;

commit;
