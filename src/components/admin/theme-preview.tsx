import type { CSSProperties } from "react";
import { Star } from "lucide-react";

/** I valori dei colori del tema modificati nell'editor. */
export interface ThemeColorValues {
  primaryColor: string;
  primaryForeground: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  sectionColor: string;
  textColor: string;
  mutedColor: string;
}

/**
 * Anteprima live del tema: un mini-mockup della pagina ospite che riusa le
 * stesse CSS variables e utility del vero frontend, così mostra esattamente
 * l'effetto dei colori mentre li scegli. Le variabili sono iniettate come
 * inline style (come fa `ThemeProvider`), quindi si aggiorna a ogni modifica.
 */
export function ThemePreview({ colors }: { colors: ThemeColorValues }) {
  const vars = {
    "--primary": colors.primaryColor,
    "--terracotta": colors.primaryColor,
    "--terracotta-strong": `color-mix(in oklab, ${colors.primaryColor}, black 12%)`,
    "--primary-foreground": colors.primaryForeground,
    "--ochre": colors.secondaryColor,
    "--background": colors.backgroundColor,
    "--card": colors.cardColor,
    "--secondary": colors.sectionColor,
    "--foreground": colors.textColor,
    "--card-foreground": colors.textColor,
    "--muted-foreground": colors.mutedColor,
  } as CSSProperties;

  return (
    <div className="sticky top-20 z-10 rounded-2xl border border-border bg-card p-3 shadow-soft">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Anteprima
      </p>

      <div
        style={vars}
        className="overflow-hidden rounded-xl border border-border"
      >
        {/* Header: colore principale + testo sul principale + selettore lingua */}
        <div className="flex items-center justify-between gap-2 bg-terracotta px-3 py-2 text-primary-foreground">
          <span className="text-sm font-bold tracking-tight">Casa Rossa</span>
          <div className="flex items-center gap-1 rounded-full bg-primary-foreground/20 p-0.5">
            <span className="rounded-full bg-primary-foreground px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              IT
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground/90">
              EN
            </span>
          </div>
        </div>

        {/* Corpo: sfondo pagina */}
        <div className="space-y-2 bg-background p-3">
          {/* Card Wi-Fi: superficie brand + pulsante chiaro */}
          <div className="flex items-center justify-between gap-2 rounded-xl bg-terracotta px-3 py-2 text-primary-foreground">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-primary-foreground/70">
                Password
              </p>
              <p className="truncate text-sm font-bold">trastevere2026</p>
            </div>
            <span className="shrink-0 rounded-lg bg-primary-foreground px-2 py-1 text-[10px] font-semibold text-terracotta">
              Copia
            </span>
          </div>

          {/* Card sezione: sfondo card + chip icona + testo + testo grigio */}
          <div className="flex items-center gap-2 rounded-xl bg-card p-2.5 text-card-foreground">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-terracotta">
              <Star className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Titolo sezione
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Testo secondario grigio
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-ochre px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              Accento
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
