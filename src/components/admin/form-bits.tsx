"use client";

import { cn } from "@/lib/utils";
import type { ActionState } from "@/app/admin/[bnbId]/actions";

/** Esito di una server action, mostrato sotto al form. */
export function StatusMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-xl bg-terracotta/10 px-3.5 py-2.5 text-sm font-medium text-terracotta"
      >
        {state.message}
      </p>
    );
  }
  return (
    <p
      role="alert"
      className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive"
    >
      {state.error}
    </p>
  );
}

/** Contenitore di una sezione dell'editor, con titolo e descrizione. */
export function EditorSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
