"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ColorPickerField } from "@/components/admin/color-picker-field";
import { ThemePreview, type ThemeColorValues } from "@/components/admin/theme-preview";
import { Button } from "@/components/ui/button";
import type { BnbTheme } from "@/types";

type ColorState = ThemeColorValues;

/**
 * Palette base dell'app: gli stessi colori dell'interfaccia admin (la palette
 * `:root` di globals.css, in hex per conversione da oklch — non a occhio).
 * Serve sia come default quando una struttura non ha un colore opzionale, sia
 * per il pulsante "Ripristina colori base".
 */
const BASE_COLORS: ColorState = {
  primaryColor: "#b85c3c",
  primaryForeground: "#fef9f3",
  secondaryColor: "#d99a3c",
  backgroundColor: "#fbf4ea",
  cardColor: "#fffcf8",
  sectionColor: "#f7e5cf",
  textColor: "#3d281f",
  mutedColor: "#765f53",
};

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
    primaryForeground: theme.primaryForeground ?? BASE_COLORS.primaryForeground,
    secondaryColor: theme.secondaryColor,
    backgroundColor: theme.backgroundColor,
    cardColor: theme.cardColor ?? BASE_COLORS.cardColor,
    sectionColor: theme.sectionColor ?? BASE_COLORS.sectionColor,
    textColor: theme.textColor ?? BASE_COLORS.textColor,
    mutedColor: theme.mutedColor ?? BASE_COLORS.mutedColor,
  });

  const setColor = (name: keyof ColorState) => (value: string) =>
    setColors((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-secondary/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight">Colori del tema</h3>
          <p className="text-xs text-muted-foreground">
            Clicca un quadratino per aprire il selettore, o incolla un codice hex.
          </p>
        </div>
        {/* Reimposta gli 8 colori alla palette base dell'app. Solo lo stato
            locale: l'utente vede l'anteprima aggiornarsi e poi salva il form. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setColors(BASE_COLORS)}
          className="h-9 shrink-0 gap-1.5 rounded-xl"
        >
          <RotateCcw className="size-4" aria-hidden />
          Colori base
        </Button>
      </div>

      <ThemePreview colors={colors} />

      {GROUPS.map((group) => (
        // min-w-0: i fieldset hanno min-width:min-content di default, e i
        // suggerimenti in nowrap (truncate) li allargavano oltre lo schermo
        // del telefono. Con min-w-0 il testo torna a troncarsi con l'ellissi.
        <fieldset key={group.title} className="min-w-0 space-y-2.5">
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
