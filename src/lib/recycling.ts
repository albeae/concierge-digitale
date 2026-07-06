/**
 * Colori standard dei cassonetti della raccolta differenziata (Roma / AMA).
 * Sono costanti di DOMINIO, non colori del tema del B&B: restano fissi a
 * prescindere dalla palette della struttura. Centralizzati qui per non tenerli
 * hardcoded dentro il componente `rules-card.tsx`; le etichette testuali stanno
 * invece in `i18n.ts` (bilingui).
 */
import type { UiStrings } from "@/lib/i18n";

export type BinKey = keyof UiStrings["recycling"]["bins"];

export const RECYCLING_BINS: { key: BinKey; color: string }[] = [
  { key: "organic", color: "#7a5230" },
  { key: "paper", color: "#2563eb" },
  { key: "plastic", color: "#d97706" },
  { key: "glass", color: "#16a34a" },
  { key: "general", color: "#6b7280" },
];
