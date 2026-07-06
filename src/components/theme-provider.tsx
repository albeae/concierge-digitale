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
 */
export function ThemeProvider({ theme, children, className }: ThemeProviderProps) {
  const style = {
    "--primary": theme.primaryColor,
    "--terracotta": theme.primaryColor,
    "--terracotta-strong": `color-mix(in oklab, ${theme.primaryColor}, black 12%)`,
    "--ochre": theme.secondaryColor,
    "--background": theme.backgroundColor,
  } as CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
