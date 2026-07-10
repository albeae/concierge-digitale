"use server";

/**
 * Server action della pagina OSPITE (l'unica): invio del feedback privato
 * 1-3 stelle. Usa il client anon "puro" (`src/lib/supabase.ts`), MAI quello
 * con i cookie: qui non c'è login e la pagina deve restare statica (ISR).
 * La RLS permette ad anon la sola insert su guest_feedback — nessuna lettura.
 *
 * Come ogni scrittura: mai fiducia nel client, l'input viene rivalidato qui
 * (e comunque i vincoli della tabella sono l'ultima rete di sicurezza).
 *
 * Anti-abuso (review Codex #2, prima del QR pubblico): il form ha un campo
 * honeypot invisibile ("website") — un bot che riempie ciecamente ogni input
 * lo compila, un ospite reale non lo vede mai; se arriva pieno fingiamo
 * successo senza scrivere nulla, così non riveliamo la trappola. In più un
 * rate limit in-memory (vedi `src/lib/rate-limit.ts`) blocca sia il singolo
 * IP troppo insistente sia un volume anomalo sull'intera struttura. Il
 * messaggio d'errore resta SEMPRE lo stesso generico ("qualcosa è andato
 * storto"): un bot non deve poter distinguere "bloccato" da "validazione
 * fallita" da "errore DB".
 */
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";
import { isRateLimited } from "@/lib/rate-limit";

export type GuestFeedbackResult = { ok: boolean };

// Un ospite reale scrive un commento, non decine: generoso per non bloccare
// chi riprova dopo un errore, stretto per uno script in loop.
const IP_LIMIT = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;
// Tetto sull'intera struttura: contiene i costi anche se l'abuso arriva da
// IP diversi (bot distribuito), indipendentemente dal limite per-IP sopra.
const BNB_LIMIT = 30;
const BNB_WINDOW_MS = 60 * 60 * 1000;

export async function submitGuestFeedback(input: {
  bnbId: string;
  rating: number;
  message: string;
  /** Honeypot: deve arrivare sempre vuoto. Nome innocuo, mai autocompilato dai browser. */
  website?: string;
}): Promise<GuestFeedbackResult> {
  const bnbId = typeof input.bnbId === "string" ? input.bnbId.trim() : "";
  const rating = Number(input.rating);
  const message =
    typeof input.message === "string" ? input.message.trim().slice(0, 2000) : "";
  const honeypot = typeof input.website === "string" ? input.website.trim() : "";

  // Solo i voti "privati" 1-3: quelli alti vanno su Google Reviews, non qui.
  if (!bnbId || !message || !Number.isInteger(rating) || rating < 1 || rating > 3) {
    return { ok: false };
  }

  // Bot: finge successo, non scrive nulla, non dà indizi.
  if (honeypot) {
    console.warn(`[guest] honeypot compilato per "${bnbId}", scarto silenziosamente`);
    return { ok: true };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`feedback:ip:${ip}:${bnbId}`, IP_LIMIT, IP_WINDOW_MS)) {
    console.warn(`[guest] rate limit IP superato per "${bnbId}"`);
    return { ok: false };
  }
  if (isRateLimited(`feedback:bnb:${bnbId}`, BNB_LIMIT, BNB_WINDOW_MS)) {
    console.warn(`[guest] rate limit struttura superato per "${bnbId}"`);
    return { ok: false };
  }

  const { error } = await supabase.from("guest_feedback").insert({
    bnb_client_id: bnbId,
    rating,
    message,
  });

  if (error) {
    console.error(`[guest] submitGuestFeedback("${bnbId}") fallita:`, error.message);
    return { ok: false };
  }
  return { ok: true };
}
