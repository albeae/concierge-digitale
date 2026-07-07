import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Accesso titolare",
  robots: { index: false, follow: false },
};

/**
 * Pagina di login del titolare. La protezione/redirect la fa il proxy
 * (src/proxy.ts): se si è già loggati si viene mandati a /admin.
 * Nessuna registrazione: gli account si creano a mano su Supabase (Fase 3).
 */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Area titolare</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accedi per gestire la tua struttura: Wi-Fi, regole, trasporti e posti
          consigliati.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <LoginForm />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Concierge Digitale · accesso riservato
      </p>
    </main>
  );
}
