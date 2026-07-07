/**
 * Data Access Layer dell'area admin (Fase 3).
 *
 * Centralizza il controllo di sessione e le letture "possedute": ogni accesso
 * ai dati admin passa da qui, così l'autorizzazione non si dimentica. Usa il
 * client server con cookie (JWT del titolare) → la RLS fa rispettare
 * `owner_id`. Importa `next/headers`, quindi è implicitamente solo-server.
 *
 * Difesa in profondità: oltre alla RLS, `getOwnedBnb*` filtra per `owner_id`
 * e le pagine/azioni chiamano `requireUser()`.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import {
  BNB_COLUMNS,
  PLACE_COLUMNS,
  mapBnb,
  mapPlace,
  type BnbRow,
  type PlaceRow,
} from "@/lib/bnb-mappers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Bnb, Place } from "@/types";

/**
 * Utente loggato (o null). `cache()` lo memoizza nella richiesta: `getUser()`
 * chiama il server Auth di Supabase per rivalidare il token, quindi conviene
 * non ripeterlo tra pagina, layout e azioni dello stesso render.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Come sopra, ma reindirizza al login se non c'è sessione. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Le strutture di cui il titolare loggato è proprietario. */
export async function getOwnedBnbs(): Promise<Bnb[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bnb_clients")
    .select(BNB_COLUMNS)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[auth] getOwnedBnbs fallita:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as BnbRow[]).map(mapBnb);
}

/** Una struttura posseduta dato lo slug, o null se non esiste / non è sua. */
export async function getOwnedBnb(id: string): Promise<Bnb | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bnb_clients")
    .select(BNB_COLUMNS)
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(`[auth] getOwnedBnb("${id}") fallita:`, error.message);
    return null;
  }
  return data ? mapBnb(data as unknown as BnbRow) : null;
}

/** I posti di una struttura posseduta, ordinati come li vede l'ospite. */
export async function getOwnedBnbPlaces(bnbId: string): Promise<Place[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(PLACE_COLUMNS)
    .eq("bnb_client_id", bnbId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(`[auth] getOwnedBnbPlaces("${bnbId}") fallita:`, error.message);
    return [];
  }
  return ((data ?? []) as unknown as PlaceRow[]).map(mapPlace);
}
