/**
 * Data layer pubblico (Fase 2): legge B&B e posti consigliati da Supabase per
 * le pagine ospite, con il client anon "puro" (`src/lib/supabase.ts`).
 *
 * Mantiene le firme async usate dai server component. Le colonne arrivano in
 * snake_case e vengono mappate sui tipi camelCase in `src/lib/bnb-mappers.ts`
 * (condivisi con il data layer admin, `src/lib/auth.ts`).
 *
 * Ogni funzione è avvolta in `cache()` di React: dentro la stessa richiesta
 * (es. `generateMetadata` + pagina) la query parte una volta sola.
 * In caso di errore (DB non raggiungibile, schema non ancora applicato) si
 * logga e si restituisce "vuoto" (undefined / []): la pagina risponde 404
 * invece di far fallire build o richiesta.
 */
import { cache } from "react";
import {
  BNB_COLUMNS,
  PLACE_COLUMNS,
  mapBnb,
  mapPlace,
  type BnbRow,
  type PlaceRow,
} from "@/lib/bnb-mappers";
import { supabase } from "@/lib/supabase";
import type { Bnb, Place } from "@/types";

/** Restituisce un B&B dato il suo id (slug dell'URL), o undefined. */
export const getBnb = cache(async (id: string): Promise<Bnb | undefined> => {
  const { data, error } = await supabase
    .from("bnb_clients")
    .select(BNB_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`[data] getBnb("${id}") fallita:`, error.message);
    return undefined;
  }
  if (!data) return undefined;
  return mapBnb(data as unknown as BnbRow);
});

/** Tutti gli id disponibili (per `generateStaticParams` e il redirect root). */
export const getBnbIds = cache(async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("bnb_clients")
    .select("id")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[data] getBnbIds() fallita:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.id);
});

/** Posti consigliati di un B&B, nell'ordine scelto dall'host (sort_order). */
export const getPlaces = cache(async (bnbId: string): Promise<Place[]> => {
  const { data, error } = await supabase
    .from("restaurants")
    .select(PLACE_COLUMNS)
    .eq("bnb_client_id", bnbId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(`[data] getPlaces("${bnbId}") fallita:`, error.message);
    return [];
  }
  return ((data ?? []) as unknown as PlaceRow[]).map(mapPlace);
});
