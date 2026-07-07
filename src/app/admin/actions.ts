"use server";

/**
 * Server action di autenticazione (Fase 3). Le credenziali restano lato server
 * (mai nel bundle client). Login e logout scrivono/azzerano i cookie di
 * sessione tramite il client server con `@supabase/ssr`.
 */
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type LoginState = { error: string } | undefined;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Messaggio generico: non riveliamo se l'email esiste.
    return { error: "Email o password non corretti." };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
