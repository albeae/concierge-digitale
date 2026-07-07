"use server";

/**
 * Server action dell'editor (Fase 3). Ogni azione:
 *  1. verifica che il titolare loggato possieda la struttura (`getOwnedBnb`,
 *     che a sua volta fa `requireUser`) — difesa in profondità oltre alla RLS;
 *  2. normalizza l'input (niente fiducia nei dati del client);
 *  3. scrive con il client server (JWT del titolare → la RLS applica owner_id);
 *  4. rivalida la pagina ospite così la modifica si vede subito.
 */
import { revalidatePath } from "next/cache";
import { getOwnedBnb } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type {
  BnbContent,
  BnbLocation,
  HouseRule,
  Locale,
  Localized,
  PlaceCategory,
} from "@/types";

export type ActionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

const PLACE_CATEGORIES: PlaceCategory[] = ["ristorante", "bar", "servizio"];

function str(v: FormDataEntryValue | null | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Rivalida la pagina ospite (ISR) dopo una modifica. */
function refreshGuest(bnbId: string) {
  revalidatePath(`/${bnbId}`);
}

// ---------------------------------------------------------------------------
// Dati generali: nome, tema, toggle, indirizzo, contatti.
// ---------------------------------------------------------------------------
export async function updateBnbGeneral(
  bnbId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owned = await getOwnedBnb(bnbId);
  if (!owned) return { ok: false, error: "Struttura non trovata o non tua." };

  const name = str(formData.get("name"));
  if (!name) return { ok: false, error: "Il nome non può essere vuoto." };

  const theme = {
    primaryColor: str(formData.get("primaryColor")),
    secondaryColor: str(formData.get("secondaryColor")),
    backgroundColor: str(formData.get("backgroundColor")),
    logoUrl: str(formData.get("logoUrl")),
    heroImage: str(formData.get("heroImage")),
  };

  const toggles = {
    hasKitchen: formData.get("hasKitchen") === "on",
    hasParking: formData.get("hasParking") === "on",
    offersBreakfast: formData.get("offersBreakfast") === "on",
  };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bnb_clients")
    .update({
      name,
      theme,
      toggles,
      address: str(formData.get("address")),
      host_phone: str(formData.get("host_phone")),
      host_whatsapp: str(formData.get("host_whatsapp")),
    })
    .eq("id", bnbId);

  if (error) {
    console.error("[admin] updateBnbGeneral:", error.message);
    return { ok: false, error: "Salvataggio non riuscito. Riprova." };
  }

  refreshGuest(bnbId);
  return { ok: true, message: "Dati generali salvati." };
}

// ---------------------------------------------------------------------------
// Contenuti + trasporti, multilingua. Arrivano come JSON (il client gestisce
// tab lingua e regole della casa come array).
// ---------------------------------------------------------------------------
function normalizeContent(v: unknown): BnbContent {
  const o = (v ?? {}) as Record<string, unknown>;
  const rules = Array.isArray(o.houseRules) ? o.houseRules : [];
  const houseRules: HouseRule[] = rules
    .map((r) => {
      const rr = (r ?? {}) as Record<string, unknown>;
      return {
        id:
          typeof rr.id === "string" && rr.id
            ? rr.id
            : `rule-${crypto.randomUUID().slice(0, 8)}`,
        icon: typeof rr.icon === "string" ? rr.icon.trim() : "",
        text: typeof rr.text === "string" ? rr.text.trim() : "",
      };
    })
    .filter((r) => r.text !== "" || r.icon !== "");

  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  return {
    welcomeMessage: s("welcomeMessage"),
    wifiNetworkName: s("wifiNetworkName"),
    wifiPassword: s("wifiPassword"),
    checkIn: s("checkIn"),
    checkOut: s("checkOut"),
    houseRules,
  };
}

function contentIsEmpty(c: BnbContent): boolean {
  return (
    !c.welcomeMessage &&
    !c.wifiNetworkName &&
    !c.wifiPassword &&
    !c.checkIn &&
    !c.checkOut &&
    c.houseRules.length === 0
  );
}

function normalizeLocation(v: unknown): BnbLocation {
  const o = (v ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  return { airport: s("airport"), train: s("train"), ztl: s("ztl") };
}

function locationIsEmpty(l: BnbLocation): boolean {
  return !l.airport && !l.train && !l.ztl;
}

export async function updateBnbContent(
  bnbId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owned = await getOwnedBnb(bnbId);
  if (!owned) return { ok: false, error: "Struttura non trovata o non tua." };

  let parsed: { content?: Record<string, unknown>; location?: Record<string, unknown> };
  try {
    parsed = JSON.parse(str(formData.get("payload")) || "{}");
  } catch {
    return { ok: false, error: "Dati non validi." };
  }

  // `en` è sempre presente (base del fallback); it/es solo se non vuoti, così
  // una lingua lasciata in bianco ripiega su `en` invece di salvare vuoti.
  const contentOut = {
    en: normalizeContent(parsed.content?.en),
  } as Localized<BnbContent>;
  const locationOut = {
    en: normalizeLocation(parsed.location?.en),
  } as Localized<BnbLocation>;

  for (const l of ["it", "es"] as const satisfies readonly Locale[]) {
    const c = normalizeContent(parsed.content?.[l]);
    if (!contentIsEmpty(c)) contentOut[l] = c;
    const loc = normalizeLocation(parsed.location?.[l]);
    if (!locationIsEmpty(loc)) locationOut[l] = loc;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bnb_clients")
    .update({ content: contentOut, location: locationOut })
    .eq("id", bnbId);

  if (error) {
    console.error("[admin] updateBnbContent:", error.message);
    return { ok: false, error: "Salvataggio non riuscito. Riprova." };
  }

  refreshGuest(bnbId);
  return { ok: true, message: "Contenuti salvati." };
}

// ---------------------------------------------------------------------------
// Posti consigliati: insert/update (upsert) e delete, uno per volta.
// ---------------------------------------------------------------------------
export async function upsertPlace(
  bnbId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owned = await getOwnedBnb(bnbId);
  if (!owned) return { ok: false, error: "Struttura non trovata o non tua." };

  const category = str(formData.get("category")) as PlaceCategory;
  if (!PLACE_CATEGORIES.includes(category)) {
    return { ok: false, error: "Categoria non valida." };
  }

  const nameEn = str(formData.get("name_en"));
  if (!nameEn) {
    return { ok: false, error: "Il nome (EN) è obbligatorio." };
  }

  // name { it, en }: en garantito; it solo se compilato.
  const name: Localized<string> = { en: nameEn };
  const nameIt = str(formData.get("name_it"));
  if (nameIt) name.it = nameIt;

  // description { it, en, es }: en garantito; it/es solo se compilati.
  const description: Localized<string> = { en: str(formData.get("description_en")) };
  const descIt = str(formData.get("description_it"));
  const descEs = str(formData.get("description_es"));
  if (descIt) description.it = descIt;
  if (descEs) description.es = descEs;

  const sortRaw = Number.parseInt(str(formData.get("sort_order")), 10);
  const row = {
    bnb_client_id: bnbId,
    category,
    name,
    description,
    walking_distance: str(formData.get("walking_distance")),
    image_url: str(formData.get("image_url")),
    google_maps_url: str(formData.get("google_maps_url")),
    sort_order: Number.isFinite(sortRaw) ? sortRaw : 0,
  };

  const supabase = await createSupabaseServerClient();
  const placeId = str(formData.get("place_id"));

  const { error } = placeId
    ? await supabase
        .from("restaurants")
        .update(row)
        .eq("id", placeId)
        .eq("bnb_client_id", bnbId)
    : await supabase.from("restaurants").insert(row);

  if (error) {
    console.error("[admin] upsertPlace:", error.message);
    return { ok: false, error: "Salvataggio del posto non riuscito." };
  }

  refreshGuest(bnbId);
  return {
    ok: true,
    message: placeId ? "Posto aggiornato." : "Posto aggiunto.",
  };
}

export async function deletePlace(
  bnbId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owned = await getOwnedBnb(bnbId);
  if (!owned) return { ok: false, error: "Struttura non trovata o non tua." };

  const placeId = str(formData.get("place_id"));
  if (!placeId) return { ok: false, error: "Posto non valido." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", placeId)
    .eq("bnb_client_id", bnbId);

  if (error) {
    console.error("[admin] deletePlace:", error.message);
    return { ok: false, error: "Eliminazione non riuscita." };
  }

  refreshGuest(bnbId);
  return { ok: true, message: "Posto eliminato." };
}
