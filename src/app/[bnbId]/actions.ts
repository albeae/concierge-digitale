"use server";

/**
 * Server action della pagina OSPITE (l'unica): invio del feedback privato
 * 1-3 stelle. Usa il client anon "puro" (`src/lib/supabase.ts`), MAI quello
 * con i cookie: qui non c'è login e la pagina deve restare statica (ISR).
 * La RLS permette ad anon la sola insert su guest_feedback — nessuna lettura.
 *
 * Come ogni scrittura: mai fiducia nel client, l'input viene rivalidato qui
 * (e comunque i vincoli della tabella sono l'ultima rete di sicurezza).
 */
import { supabase } from "@/lib/supabase";

export type GuestFeedbackResult = { ok: boolean };

export async function submitGuestFeedback(input: {
  bnbId: string;
  rating: number;
  message: string;
}): Promise<GuestFeedbackResult> {
  const bnbId = typeof input.bnbId === "string" ? input.bnbId.trim() : "";
  const rating = Number(input.rating);
  const message =
    typeof input.message === "string" ? input.message.trim().slice(0, 2000) : "";

  // Solo i voti "privati" 1-3: quelli alti vanno su Google Reviews, non qui.
  if (!bnbId || !message || !Number.isInteger(rating) || rating < 1 || rating > 3) {
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
