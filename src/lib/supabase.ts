/**
 * Client Supabase condiviso (Fase 2).
 *
 * Usa la anon key: grazie alla Row Level Security può SOLO leggere
 * (vedi supabase/schema.sql). Le variabili sono `NEXT_PUBLIC_` così lo stesso
 * client potrà essere usato anche lato browser quando servirà (es. invio
 * feedback); per ora lo usano solo i server component via `src/lib/data.ts`.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variabili d'ambiente Supabase mancanti: servono NEXT_PUBLIC_SUPABASE_URL " +
      "e NEXT_PUBLIC_SUPABASE_ANON_KEY (in .env.local in locale, nelle " +
      "Environment Variables su Vercel).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Niente sessione da persistere: non c'è login (arriva in Fase 3).
  auth: { persistSession: false },
});
