/**
 * Contatti dell'host — fonte UNICA (usata da azioni rapide Home e card
 * Emergenze), così i numeri non vengono ripetuti a mano nei componenti.
 *
 * Placeholder da collegare: nello schema Supabase questi diventeranno campi
 * contatto su `bnb_clients` (telefono/WhatsApp dell'host). Vedi CLAUDE.md.
 * Il 112 è il numero unico europeo per le emergenze: è una costante, non un
 * contatto dell'host.
 */
export const HOST_PHONE = "+390000000000";
export const HOST_WHATSAPP = "390000000000";

/** Numero unico europeo per le emergenze. */
export const EMERGENCY_NUMBER = "112";

/** URL `tel:` per una chiamata. */
export const telUrl = (number: string) => `tel:${number.replace(/\s/g, "")}`;

/** URL `wa.me` per aprire una chat WhatsApp. */
export const whatsappUrl = (number: string) =>
  `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
