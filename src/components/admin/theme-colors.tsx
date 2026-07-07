"use client";

import { useState } from "react";
import { ColorPickerField } from "@/components/admin/color-picker-field";
import type { BnbTheme } from "@/types";

// Default (hex) dei colori aggiunti in Fase 3, allineati alla palette di base:
// una struttura che non li ha ancora parte dall'aspetto attuale.
const DEFAULTS = {
  textColor: "#3d281f",
  mutedColor: "#765f53",
  cardColor: "#fffcf8",
  sectionColor: "#f7e5cf",
} as const;

type ColorState = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  sectionColor: string;
  textColor: string;
  mutedColor: string;
};

const GROUPS: {
  title: string;
  fields: { name: keyof ColorState; label: string; hint: string }[];
}[] = [
  {
    title: "Brand",
    fields: [
      { name: "primaryColor", label: "Colore principale", hint: "Header, pulsanti, accenti forti" },
      { name: "secondaryColor", label: "Colore accento", hint: "Dettagli secondari (ocra)" },
    ],
  },
  {
    title: "Superfici",
    fields: [
      { name: "backgroundColor", label: "Sfondo pagina", hint: "Sfondo generale dell'app" },
      { name: "cardColor", label: "Sfondo sezioni", hint: "Le card e i pannelli" },
      { name: "sectionColor", label: "Sfondo icone", hint: "I cerchietti dietro le icone e i widget" },
    ],
  },
  {
    title: "Testo",
    fields: [
      { name: "textColor", label: "Colore del testo", hint: "Testo principale" },
      { name: "mutedColor", label: "Testo secondario", hint: "Didascalie ed etichette grigie" },
    ],
  },
];

export function ThemeColors({ theme }: { theme: BnbTheme }) {
  const [colors, setColors] = useState<ColorState>({
    primaryColor: theme.primaryColor,
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
