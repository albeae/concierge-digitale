/**
 * Validazione degli URL inseriti nel pannello admin e poi mostrati/aperti nel
 * browser dell'OSPITE (review Codex #4). Regola: mai salvare in silenzio un
 * valore sbagliato — o è nella forma attesa, o il form dà errore.
 *
 *  • Link recensioni Google e link Google Maps → solo https + host Google noti
 *    (un URL di terzi aperto in un tab dell'ospite sarebbe un vettore di
 *    phishing col nome della struttura).
 *  • URL immagine (logo, hero, foto posto) inseriti a mano → solo https, così
 *    niente `http:` (mixed content) né schemi strani; sono ammessi anche i
 *    path relativi alla root (`/icon.svg`), che sono le immagini di default
 *    servite dallo stesso dominio.
 *
 * Nota anti-spoofing: si confronta l'hostname vero (`new URL(...).hostname`),
 * mai una substring dell'URL. Così `https://google.com.evil.com` e
 * `https://evilgoogle.com` NON passano (il loro host non è un dominio Google).
 */

/** https:// ben formato, qualunque host. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Path relativo alla root del sito (`/foo.svg`), non protocol-relative (`//`). */
export function isRootRelative(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

/** Riferimento immagine accettabile: https, oppure path relativo alla root. */
export function isImageRef(value: string): boolean {
  return isHttpsUrl(value) || isRootRelative(value);
}

// Domini "corti" che Google usa per condividere schede/recensioni/mappe.
const GOOGLE_SHORT_HOSTS = ["g.page", "goo.gl", "maps.app.goo.gl"];

/**
 * https + host di proprietà Google: `google.com` e ccTLD (`google.it`,
 * `google.co.uk`) con eventuale sottodominio (`www.`, `maps.`, `search.`),
 * più i domini corti di condivisione. Copre sia i link recensioni sia i
 * link Maps (sono tutti host Google).
 */
export function isGoogleUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (GOOGLE_SHORT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return true;
  }
  // `google.<tld>` come label finale del dominio (con o senza sottodominio).
  // L'ancora finale ($) impedisce match come `google.com.evil.com`.
  return /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2,3})?$/.test(host);
}
