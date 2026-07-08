import type { CSSProperties } from "react";
import { Check, Star, TriangleAlert } from "lucide-react";
import { contrastRatio, WCAG_AA_LARGE, WCAG_AA_MIN } from "@/lib/contrast";

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
 * Le coppie testo/sfondo davvero usate nella pagina ospite: sono quelle da
 * tenere leggibili. Le etichette ricalcano i nomi dei campi dell'editor.
 */
const CONTRAST_PAIRS: {
  fg: keyof ThemeColorValues;
  bg: keyof ThemeColorValues;
  label: string;
}[] = [
  { fg: "textColor", bg: "backgroundColor", label: "Testo principale su Sfondo pagina" },
  { fg: "textColor", bg: "cardColor", label: "Testo principale su Sfondo riquadri" },
  { fg: "mutedColor", bg: "backgroundColor", label: "Testo secondario su Sfondo pagina" },
  { fg: "mutedColor", bg: "cardColor", label: "Testo secondario su Sfondo riquadri" },
  { fg: "primaryForeground", bg: "primaryColor", label: "Testo sui colori su Colore principale" },
  { fg: "primaryForeground", bg: "secondaryColor", label: "Testo sui colori su Colore accento" },
];

/**
 * Guardia di contrasto WCAG su due livelli: sotto 3:1 (soglia AA anche per il
 * testo grande) l'avviso è rosso — quel testo è illeggibile quasi ovunque;
 * tra 3 e 4.5 (soglia AA per il testo normale) è un suggerimento soft.
 * I campi con hex non ancora validi vengono semplicemente saltati.
 */
function ContrastWarnings({ colors }: { colors: ThemeColorValues }) {
  const issues = CONTRAST_PAIRS.flatMap((pair) => {
    const ratio = contrastRatio(colors[pair.fg], colors[pair.bg]);
    return ratio !== null && ratio < WCAG_AA_MIN
      ? [{ label: pair.label, ratio, severe: ratio < WCAG_AA_LARGE }]
      : [];
  });

  if (issues.length === 0) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Check className="size-3.5 shrink-0" aria-hidden />
        Testi ben leggibili su tutti gli sfondi.
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-1" role="alert">
      {issues.map((issue) => (
        <li
          key={issue.label}
          className={
            issue.severe
              ? "flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-medium leading-relaxed text-destructive"
              : "flex items-start gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium leading-relaxed text-secondary-foreground"
          }
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {issue.severe
              ? `${issue.label}: contrasto ${issue.ratio.toFixed(1)} — testo quasi illeggibile, cambia uno dei due colori.`
              : `${issue.label}: contrasto ${issue.ratio.toFixed(1)}, sotto il consigliato ${WCAG_AA_MIN}. Meglio aumentare un po' lo stacco.`}
          </span>
        </li>
      ))}
    </ul>
  );
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

      {/* Guardia di contrasto: sempre visibile perché il riquadro è sticky. */}
      <ContrastWarnings colors={colors} />
    </div>
  );
}
