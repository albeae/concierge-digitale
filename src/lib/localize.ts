/**
 * Helper di localizzazione con fallback su "en".
 * Regola: mostro la lingua richiesta, ma se una chiave manca (o è vuota) in
 * quella lingua, ripiego sul valore inglese.
 */
import type { Locale, Localized } from "@/types";

/** Testo localizzato nella lingua richiesta, con fallback su "en". */
export function pick(text: Localized<string>, locale: Locale): string {
  const value = text[locale];
  if (value !== undefined && value !== "") return value;
  return text.en;
}

/**
 * Oggetto localizzato nella lingua richiesta, con fallback **per-chiave** su
 * "en": se una singola chiave manca o è vuota in quella lingua, usa quella
 * inglese al suo posto.
 */
export function resolveLocalized<T extends object>(
  byLocale: Localized<T>,
  locale: Locale,
): T {
  const fallback = byLocale.en;
  const primary = byLocale[locale];
  if (!primary || primary === fallback) return fallback;

  const result = { ...fallback };
  for (const key of Object.keys(fallback) as (keyof T)[]) {
    const value = primary[key];
    const isEmpty =
      value === undefined ||
      value === null ||
      (value as unknown) === "" ||
      (Array.isArray(value) && value.length === 0);
    if (!isEmpty) result[key] = value;
  }
  return result;
}
