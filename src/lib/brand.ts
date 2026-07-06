/**
 * Colori di brand "chrome" del prodotto (barra del browser, splash PWA):
 * fonte UNICA, così non vengono ricopiati a mano in manifest.ts e layout.tsx.
 *
 * Nota: la palette *per-struttura* vive nel `theme` dei dati (mock-data.ts →
 * futura tabella `bnb_clients.theme`) ed è iniettata a runtime dal ThemeProvider.
 * Questi valori sono solo il default statico usato prima che il tema del B&B sia
 * noto (il manifest è unico per l'app, non per tenant). Coincidono con la palette
 * di "Casa Rossa".
 */
export const BRAND = {
  /** Terracotta: colore tema della status bar / theme_color PWA. */
  primary: "#b85c3c",
  /** Crema: sfondo dello splash screen PWA. */
  background: "#fbf4ea",
} as const;
