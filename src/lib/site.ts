/**
 * Dominio pubblico di produzione, usato per generare URL "veri" indipendenti
 * da dove gira l'admin (locale, preview Vercel, produzione): un QR destinato
 * alla stampa deve SEMPRE puntare al dominio che gli ospiti scansioneranno,
 * mai a un deploy temporaneo (vedi CLAUDE.md, errore evitato 2026-07-10).
 *
 * Override raro via `NEXT_PUBLIC_SITE_URL` (es. un ambiente di staging
 * dedicato con proprio dominio); di default punta al dominio reale.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://albeaconcierge.it";
