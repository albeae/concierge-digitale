/**
 * Data layer (Fase 2): legge B&B e posti consigliati da Supabase.
 *
 * Sostituisce i dati finti di `mock-data.ts` mantenendo le stesse firme
 * (ora async): i server component fanno `await getBnb(...)` ecc.
 * Le colonne arrivano in snake_case dal database e vengono mappate qui sui
 * tipi camelCase di `src/types`; i jsonb (theme, toggles, content, location,
 * name, description) hanno già la forma dei tipi di dominio.
 *
 * Ogni funzione è avvolta in `cache()` di React: dentro la stessa richiesta
 * (es. `generateMetadata` + pagina) la query parte una volta sola.
 * In caso di errore (DB non raggiungibile, schema non ancora applicato) si
 * logga e si restituisce "vuoto" (undefined / []): la pagina risponde 404
 * invece di far fallire build o richiesta.
 */
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Bnb,
  BnbContent,
  BnbLocation,
  BnbTheme,
  BnbToggles,
  Localized,
  LocalizedText,
  Place,
  PlaceCategory,
} from "@/types";

/** Riga di `bnb_clients` così come esce da Supabase. */
interface BnbRow {
  id: string;
  name: string;
  theme: BnbTheme;
  toggles: BnbToggles;
  content: Localized<BnbContent>;
  location: Localized<BnbLocation>;
  address: string;
  host_phone: string;
  host_whatsapp: string;
}

/** Riga di `restaurants` così come esce da Supabase. */
interface PlaceRow {
  id: string;
  bnb_client_id: string;
  category: PlaceCategory;
  name: LocalizedText;
  description: LocalizedText;
  walking_distance: string;
  image_url: string;
  google_maps_url: string;
}

const BNB_COLUMNS =
  "id, name, theme, toggles, content, location, address, host_phone, host_whatsapp";

const PLACE_COLUMNS =
  "id, bnb_client_id, category, name, description, walking_distance, image_url, google_maps_url";

function mapBnb(row: BnbRow): Bnb {
  return {
    id: row.id,
    name: row.name,
    theme: row.theme,
    toggles: row.toggles,
    content: row.content,
    location: row.location,
    address: row.address,
    hostPhone: row.host_phone,
    hostWhatsapp: row.host_whatsapp,
  };
}

function mapPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    bnbId: row.bnb_client_id,
    category: row.category,
    name: row.name,
    description: row.description,
    walkingDistance: row.walking_distance,
    imageUrl: row.image_url,
    googleMapsUrl: row.google_maps_url,
  };
}

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
