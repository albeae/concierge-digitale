/**
 * Client Supabase lato server per l'AREA ADMIN (Fase 3).
 *
 * A differenza di `src/lib/supabase.ts` (client anon "puro" usato dalle pagine
 * ospite statiche), questo legge/scrive i cookie di sessione: le richieste
 * portano il JWT del titolare loggato, così le policy RLS `auth.uid() =
 * owner_id` gli permettono di modificare la propria struttura.
 *
 * Va creato UNA VOLTA per richiesta (mai condiviso tra richieste). Le pagine
 * ospite NON devono usarlo, altrimenti leggendo i cookie diventerebbero
 * dinamiche e perderebbero l'ISR statico della Fase 2.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variabili d'ambiente Supabase mancanti: servono NEXT_PUBLIC_SUPABASE_URL " +
      "e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `set` lancia se chiamato da un Server Component (non da un'action o
          // route handler): è normale. Il refresh della sessione lo fa il
          // proxy (src/proxy.ts), quindi qui si può ignorare.
        }
      },
    },
  });
}
