import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  title: string;
  /** Sottotitolo opzionale (es. email del titolare o slug struttura). */
  subtitle?: string;
  /** Se presente, mostra una freccia "indietro" verso questo href. */
  backHref?: string;
  children: React.ReactNode;
}

/**
 * Cornice comune delle pagine admin: header sticky con titolo, eventuale
 * "indietro" e il pulsante di logout (server action). Non fa controlli di
 * sessione — quelli stanno nelle pagine (requireUser) e nella RLS.
 */
export function AdminShell({
  title,
  subtitle,
  backHref,
  children,
}: AdminShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Indietro"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl"
          >
            <LogOut className="size-4" aria-hidden />
            Esci
          </Button>
        </form>
      </header>

      <main className="flex-1 px-5 py-7">{children}</main>
    </div>
  );
}
