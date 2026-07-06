import type { Locale } from "@/types";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label: string;
}

const LOCALES: Locale[] = ["it", "en", "es"];

export function LanguageToggle({ locale, onChange, label }: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 items-center rounded-full bg-primary-foreground/20 p-1 backdrop-blur"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            aria-pressed={active}
            className={cn(
              "flex h-10 min-w-11 items-center justify-center rounded-full px-3.5 text-sm font-semibold uppercase transition-colors",
              active ? "bg-primary-foreground text-primary" : "text-primary-foreground/90",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
