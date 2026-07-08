"use client";

import { useState } from "react";
import { ColorPickerField } from "@/components/admin/color-picker-field";
import { ThemePreview, type ThemeColorValues } from "@/components/admin/theme-preview";
import type { BnbTheme } from "@/types";

// Default (hex) dei colori aggiunti in Fase 3, allineati alla palette di base:
// una struttura che non li ha ancora parte dall'aspetto attuale.
const DEFAULTS = {
  primaryForeground: "#fef9f3",
  textColor: "#3d281f",
  mutedColor: "#765f53",
  cardColor: "#fffcf8",
  sectionColor: "#f7e5cf",
} as const;

type ColorState = ThemeColorValues;

const GROUPS: {
  title: string;
  fields: { name: keyof ColorState; label: string; hint: string }[];
}[] = [
  {
    title: "Colori identità",
    fields: [
      { name: "primaryColor", label: "Colore principale", hint: "Barra in alto, pulsanti e link" },
      { name: "secondaryColor", label: "Colore accento", hint: "Piccoli dettagli in risalto (badge, cornici)" },
    ],
  },
  {
    title: "Sfondi",
    fields: [
      { name: "backgroundColor", label: "Sfondo pagina", hint: "Dietro a tutta la pagina" },
      { name: "cardColor", label: "Sfondo riquadri", hint: "Le card e i pannelli bianchi" },
      { name: "sectionColor", label: "Sfondo icone", hint: "I cerchietti dietro le icone" },
    ],
  },
  {
    title: "Testo",
    fields: [
      { name: "textColor", label: "Testo principale", hint: "Le scritte che si leggono di più" },
      { name: "mutedColor", label: "Testo secondario", hint: "Le scritte piccole in grigio" },
      { name: "primaryForeground", label: "Testo sui colori", hint: "Scritte e icone sopra la barra e i pulsanti colorati" },
    ],
  },
];

export function ThemeColors({ theme }: { theme: BnbTheme }) {
  const [colors, setColors] = useState<ColorState>({
    primaryColor: theme.primaryColor,
    primaryForeground: theme.primaryForeground ?? DEFAULTS.primaryForeground,
    secondaryColor: theme.secondaryColor,
    backgroundColor: theme.backgroundColor,
    cardColor: theme.cardColor ?? DEFAULTS.cardColor,
    sectionColor: theme.sectionColor ?? DEFAULTS.sectionColor,
    textColor: theme.textColor ?? DEFAULTS.textColor,
    mutedColor: theme.mutedColor ?? DEFAULTS.mutedColor,
  });

  const setColor = (name: keyof ColorState) => (value: string) =>
    setColors((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-secondary/30 p-4">
      <div>
        <h3 className="text-sm font-bold tracking-tight">Colori del tema</h3>
        <p className="text-xs text-muted-foreground">
          Clicca un quadratino per aprire il selettore, o incolla un codice hex.
        </p>
      </div>

      <ThemePreview colors={colors} />

      {GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-2.5">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </legend>
          <div className="space-y-2.5">
            {group.fields.map((f) => (
              <ColorPickerField
                key={f.name}
                name={f.name}
                label={f.label}
                hint={f.hint}
                value={colors[f.name]}
                onChange={setColor(f.name)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
