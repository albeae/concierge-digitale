import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ExternalLink, Home, Pencil } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getOwnedBnbs, getSessionUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Le tue strutture",
  robots: { index: false, follow: false },
};

// Area riservata: sempre dinamica, mai prerenderizzata.
export const dynamic = "force-dynamic";

/**
 * Dashboard del titolare: elenca le strutture di cui è proprietario e linka
 * all'editor di ciascuna. Se nessuna struttura è collegata al suo account,
 * spiega il passo mancante (collegare `owner_id`, vedi supabase/phase-3-auth.sql).
 */
export default async function AdminDashboardPage() {
  // requireUser() è dentro getOwnedBnbs; getSessionUser per mostrare l'email.
  const [user, bnbs] = await Promise.all([getSessionUser(), getOwnedBnbs()]);

  return (
    <AdminShell title="Le tue strutture" subtitle={user?.email ?? undefined}>
      {bnbs.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-6">
            <h2 className="text-base font-semibold">
              Nessuna struttura collegata
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Il tuo account è attivo ma non è ancora associato a nessuna
              struttura. Chiedi all&apos;amministratore di collegare il tuo
              profilo (impostando <code>owner_id</code> sulla struttura in
              Supabase).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bnbs.map((bnb) => (
            <Card key={bnb.id} className="py-0">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-terracotta">
                  <Home className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">
                    {bnb.name}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    /{bnb.id}
                  </p>
                </div>
                <Link
                  href={`/${bnb.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Apri la pagina ospite"
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-4" aria-hidden />
                </Link>
                <Link
                  href={`/admin/${bnb.id}`}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-terracotta px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-terracotta-strong"
                >
                  <Pencil className="size-4" aria-hidden />
                  Modifica
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
