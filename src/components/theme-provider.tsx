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
 * I colori opzionali (`textColor`, `primaryForeground`, ...) se assenti
 * (strutture pre-Fase 3) non sovrascrivono nulla: restano i default della
 * palette in `globals.css`.
 */
export function ThemeProvider({ theme, children, className }: ThemeProviderProps) {
  const vars: Record<string, string> = {
    "--primary": theme.primaryColor,
    "--terracotta": theme.primaryColor,
    "--terracotta-strong": `color-mix(in oklab, ${theme.primaryColor}, black 12%)`,
    // L'anello di focus segue il colore principale.
    "--ring": theme.primaryColor,
    "--ochre": theme.secondaryColor,
    "--background": theme.backgroundColor,
  };

  if (theme.primaryForeground) {
    // Testo/icone SOPRA il colore principale: header, card Wi-Fi, selettore
    // lingua, pulsanti brand, badge. È anche lo sfondo delle pastiglie chiare
    // (pill lingua attiva, pulsante "Copia") che hanno testo nel colore primario.
    vars["--primary-foreground"] = theme.primaryForeground;
  }

  if (theme.textColor) {
    // Testo principale, anche dentro card e popover.
    vars["--foreground"] = theme.textColor;
    vars["--card-foreground"] = theme.textColor;
    vars["--popover-foreground"] = theme.textColor;
  }

  if (theme.mutedColor) {
    // Testo secondario/grigio: didascalie, etichette.
    vars["--muted-foreground"] = theme.mutedColor;
  }

  if (theme.cardColor) {
    // Sfondo delle card/sezioni e dei popover.
    vars["--card"] = theme.cardColor;
    vars["--popover"] = theme.cardColor;
  }

  if (theme.sectionColor) {
    // Sfondi chiari di icone/chip e widget.
    vars["--secondary"] = theme.sectionColor;
    vars["--accent"] = theme.sectionColor;
  }

  return (
    <div style={vars as CSSProperties} className={className}>
      {children}
    </div>
  );
}
