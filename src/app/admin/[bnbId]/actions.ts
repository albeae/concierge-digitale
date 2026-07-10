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

/** Un colore del tema valido: esattamente `#rrggbb`. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

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

  // Validazione colori: mai fidarsi del client. Un hex malformato produrrebbe
  // CSS variables spazzatura (tema rotto). I 3 colori obbligatori devono essere
  // #rrggbb validi; i 5 opzionali si salvano solo se validi (altrimenti si
  // scartano e resta il default della palette).
  const theme: Record<string, string> = {
    logoUrl: str(formData.get("logoUrl")),
    heroImage: str(formData.get("heroImage")),
  };
  for (const key of ["primaryColor", "secondaryColor", "backgroundColor"] as const) {
    const value = str(formData.get(key));
    if (!HEX_COLOR.test(value)) {
      return {
        ok: false,
        error: "Un colore del tema non è valido: usa un codice come #a1b2c3.",
      };
    }
    theme[key] = value;
  }
  for (const key of [
    "primaryForeground",
    "textColor",
    "mutedColor",
    "cardColor",
    "sectionColor",
  ] as const) {
    const value = str(formData.get(key));
    if (value && HEX_COLOR.test(value)) theme[key] = value;
  }

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
      google_reviews_url: str(formData.get("google_reviews_url")),
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

  const row: Record<string, unknown> = {
    bnb_client_id: bnbId,
    category,
    name,
    description,
    walking_distance: str(formData.get("walking_distance")),
    image_url: str(formData.get("image_url")),
    google_maps_url: str(formData.get("google_maps_url")),
  };
  // sort_order lo si tocca SOLO quando il form lo invia: il nuovo posto lo
  // manda (va in fondo alla lista), i posti esistenti no — il loro ordine lo
  // gestiscono le frecce (movePlace), non il salvataggio della scheda.
  const sortStr = str(formData.get("sort_order"));
  if (sortStr !== "") {
    const n = Number.parseInt(sortStr, 10);
    row.sort_order = Number.isFinite(n) ? n : 0;
  }

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

// ---------------------------------------------------------------------------
// Upload immagini su Supabase Storage (bucket bnb-images): logo, hero e foto
// dei posti caricati dal pannello invece di incollare URL. Il client
// ridimensiona prima dell'invio; qui si rifà ogni controllo (tipo, peso) e la
// RLS del bucket impone la cartella <slug> delle sole strutture possedute.
// ---------------------------------------------------------------------------
const UPLOAD_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // allineato al limite del bucket
const UPLOAD_SLOTS = new Set(["logo", "hero", "posto"]);

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadBnbImage(
  bnbId: string,
  formData: FormData,
): Promise<UploadResult> {
  const owned = await getOwnedBnb(bnbId);
  if (!owned) return { ok: false, error: "Struttura non trovata o non tua." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Nessuna immagine ricevuta." };
  }
  const ext = UPLOAD_EXT[file.type];
  if (!ext) {
    return { ok: false, error: "Formato non supportato: usa JPG, PNG o WebP." };
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return { ok: false, error: "Immagine troppo grande (max 5 MB)." };
  }
  const slotRaw = str(formData.get("slot"));
  const slot = UPLOAD_SLOTS.has(slotRaw) ? slotRaw : "img";

  // Nome sempre nuovo (niente upsert): il CDN può tenere in cache l'URL
  // vecchio per un anno, un file sovrascritto sembrerebbe "non cambiato".
  const path = `${bnbId}/${slot}-${Date.now().toString(36)}.${ext}`;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from("bnb-images")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

  if (error) {
    console.error("[admin] uploadBnbImage:", error.message);
    return {
      ok: false,
      error:
        "Caricamento non riuscito. Riprova; se è la prima volta, va applicato supabase/storage-images.sql.",
    };
  }

  const { data } = supabase.storage.from("bnb-images").getPublicUrl(path);

  // L'immagine entra nella pagina ospite solo dopo il salvataggio del form,
  // ma ogni azione di scrittura chiude con la revalidation (vedi CLAUDE.md).
  refreshGuest(bnbId);
  return { ok: true, url: data.publicUrl };
}

// ---------------------------------------------------------------------------
// Feedback privati degli ospiti: il titolare può solo eliminarli (una volta
// letti/gestiti). L'inserimento avviene dalla pagina ospite (client anon).
// ---------------------------------------------------------------------------
export async function deleteFeedback(
  bnbId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owned = await getOwnedBnb(bnbId);
  if (!owned) return { ok: false, error: "Struttura non trovata o non tua." };

  const feedbackId = str(formData.get("feedback_id"));
  if (!feedbackId) return { ok: false, error: "Feedback non valido." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("guest_feedback")
    .delete()
    .eq("id", feedbackId)
    .eq("bnb_client_id", bnbId);

  if (error) {
    console.error("[admin] deleteFeedback:", error.message);
    return { ok: false, error: "Eliminazione non riuscita." };
  }

  // I feedback non compaiono nella pagina ospite, ma ogni scrittura chiude
  // con la revalidation per mantenere l'invariante (vedi CLAUDE.md).
  refreshGuest(bnbId);
  return { ok: true, message: "Feedback eliminato." };
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

// ---------------------------------------------------------------------------
// Riordino dei posti: il client manda l'ordine COMPLETO desiderato (lista di
// id) e qui si riscrive sort_order = posizione. Il client è la sorgente di
// verità → niente race tra spostamenti rapidi (l'ultimo ordine ricevuto vince)
// e nessun problema con ordini duplicati o buchi preesistenti.
// ---------------------------------------------------------------------------
export async function reorderPlaces(
  bnbId: string,
  orderedIds: string[],
): Promise<ActionState> {
  const owned = await getOwnedBnb(bnbId);
  if (!owned) return { ok: false, error: "Struttura non trovata o non tua." };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: true, message: "Ordine invariato." };
  }

  const supabase = await createSupabaseServerClient();
  // Solo gli id che appartengono davvero a questa struttura (niente fiducia
  // nel client; la RLS è comunque l'ultima rete).
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, sort_order")
    .eq("bnb_client_id", bnbId);

  if (error) {
    console.error("[admin] reorderPlaces select:", error.message);
    return { ok: false, error: "Riordino non riuscito." };
  }

  const current = new Map(
    ((data ?? []) as { id: string; sort_order: number }[]).map((r) => [r.id, r.sort_order]),
  );
  // Riscrive sort_order = posizione, ma solo per gli id validi e SOLO quando il
  // valore cambia davvero (evita update inutili → più veloce).
  const updates = orderedIds
    .filter((id) => current.has(id))
    .map((id, position) => ({ id, position }))
    .filter(({ id, position }) => current.get(id) !== position);

  if (updates.length === 0) return { ok: true, message: "Ordine invariato." };

  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from("restaurants")
        .update({ sort_order: u.position })
        .eq("id", u.id)
        .eq("bnb_client_id", bnbId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[admin] reorderPlaces update:", failed.error.message);
    return { ok: false, error: "Riordino non riuscito." };
  }

  refreshGuest(bnbId);
  return { ok: true, message: "Ordine aggiornato." };
}
