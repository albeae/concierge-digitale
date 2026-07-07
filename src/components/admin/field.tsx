/**
 * Campi di form minimi e coerenti col tema (usano i token globali: `border`,
 * `bg-card`, `ring`, ecc.). Niente dipendenze nuove: bastano per l'admin.
 */
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-soft outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50";

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(baseField, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(baseField, "min-h-24 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return <select className={cn(baseField, "appearance-none", className)} {...props} />;
}

/** Etichetta + campo impilati, con spaziatura uniforme. */
export function FieldRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
