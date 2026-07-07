/**
 * Righe Supabase (snake_case) ↔ tipi di dominio (camelCase).
 *
 * Estratto qui perché lo condividono le letture pubbliche (`src/lib/data.ts`)
 * e quelle autenticate dell'admin (`src/lib/auth.ts`): un solo posto dove
 * vivono i nomi delle colonne e la mappatura.
 */
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
export interface BnbRow {
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
export interface PlaceRow {
  id: string;
  bnb_client_id: string;
  category: PlaceCategory;
  name: LocalizedText;
  description: LocalizedText;
  walking_distance: string;
  image_url: string;
  google_maps_url: string;
  sort_order: number;
}

export const BNB_COLUMNS =
  "id, name, theme, toggles, content, location, address, host_phone, host_whatsapp";

export const PLACE_COLUMNS =
  "id, bnb_client_id, category, name, description, walking_distance, image_url, google_maps_url, sort_order";

export function mapBnb(row: BnbRow): Bnb {
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

export function mapPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    bnbId: row.bnb_client_id,
    category: row.category,
    name: row.name,
    description: row.description,
    walkingDistance: row.walking_distance,
    imageUrl: row.image_url,
    googleMapsUrl: row.google_maps_url,
    sortOrder: row.sort_order,
  };
}
