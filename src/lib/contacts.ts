/**
 * Costanti e helper per i contatti telefonici.
 *
 * Da Fase 2 il telefono/WhatsApp dell'host non sono più placeholder nel
 * codice: arrivano dal database (colonne `host_phone` / `host_whatsapp` di
 * `bnb_clients`) e viaggiano nei componenti come prop (`bnb.hostPhone` /
 * `bnb.hostWhatsapp`). Il 112 è il numero unico europeo per le emergenze:
 * è una costante, non un contatto dell'host.
 */

/** Numero unico europeo per le emergenze. */
export const EMERGENCY_NUMBER = "112";

/** URL `tel:` per una chiamata. */
export const telUrl = (number: string) => `tel:${number.replace(/\s/g, "")}`;

/** URL `wa.me` per aprire una chat WhatsApp. */
export const whatsappUrl = (number: string) =>
  `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
