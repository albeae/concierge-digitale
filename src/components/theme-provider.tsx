import type { CSSProperties, ReactNode } from "react";
import type { BnbTheme } from "@/types";

interface ThemeProviderProps {
  theme: BnbTheme;
  children: ReactNode;
  className?: string;
}

/**
 * Inietta il tema del B&B come CSS custom properties su un wrapper.
 * I componenti usano le utility mappate su queste variabili
 * (`bg-terracotta`, `bg-background`, ...), quindi ogni struttura mostra la
 * propria palette senza colori fissi nel codice.
 *
 * `textColor`/`sectionColor` sono opzionali: se assenti (strutture pre-Fase 3)
 * non si sovrascrive nulla e restano i default della palette in `globals.css`.
 */
export function ThemeProvider({ theme, children, className }: ThemeProviderProps) {
  const vars: Record<string, string> = {
    "--primary": theme.primaryColor,
    "--terracotta": theme.primaryColor,
    "--terracotta-strong": `color-mix(in oklab, ${theme.primaryColor}, black 12%)`,
    "--ochre": theme.secondaryColor,
    "--background": theme.backgroundColor,
  };

  if (theme.textColor) {
    // Testo principale, anche dentro card e popover.
    vars["--foreground"] = theme.textColor;
    vars["--card-foreground"] = theme.textColor;
    vars["--popover-foreground"] = theme.textColor;
  }

  if (theme.sectionColor) {
    // Superfici "di sezione": sfondi chiari di icone/chip e widget.
    vars["--secondary"] = theme.sectionColor;
    vars["--accent"] = theme.sectionColor;
  }

  return (
    <div style={vars as CSSProperties} className={className}>
      {children}
    </div>
  );
}
