/**
 * Calcolo del contrasto WCAG 2.x tra due colori hex (#rrggbb).
 *
 * Usato dalla guardia di contrasto del theme editor: in mezzo minuto si
 * creano combinazioni illeggibili, l'avviso live lo impedisce PRIMA che un
 * ospite si trovi testo invisibile. Formula ufficiale:
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */

/** Soglia WCAG AA per il testo normale. */
export const WCAG_AA_MIN = 4.5;

/**
 * Soglia WCAG AA per il testo grande (titoli, grassetti): sotto questa il
 * testo è in difficoltà quasi ovunque → avviso "forte" nell'editor.
 */
export const WCAG_AA_LARGE = 3;

/** #rrggbb → [r, g, b] in 0-255, oppure null se il formato non è valido. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linearizzazione sRGB di un canale 0-255. */
function linearChannel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Luminanza relativa (0 = nero, 1 = bianco). */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  return (
    0.2126 * linearChannel(r) +
    0.7152 * linearChannel(g) +
    0.0722 * linearChannel(b)
  );
}

/**
 * Rapporto di contrasto tra due hex: da 1 (identici) a 21 (nero su bianco).
 * Restituisce null se uno dei due non è un #rrggbb valido (es. mentre si
 * sta ancora digitando nel campo).
 */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
