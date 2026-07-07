/**
 * Tipi di dominio dell'app Concierge Digitale.
 *
 * La forma ricalca lo schema Supabase (vedi supabase/schema.sql): un'unica
 * entità `bnb_clients` con tema, toggle e contenuti localizzati (it/en/es) come
 * jsonb, più una tabella `restaurants`/posti separata con FK `bnb_client_id`.
 * Da Fase 2 i dati arrivano davvero da Supabase: vedi `src/lib/data.ts`.
 */

export type Locale = "it" | "en" | "es";

/**
 * Valore localizzato. L'inglese (`en`) è sempre presente ed è la base del
 * fallback; le altre lingue sono opzionali e, se mancano, ripiegano su `en`
 * (vedi `src/lib/localize.ts`). Così si può aggiungere una lingua a poco a poco
 * senza dover tradurre subito ogni campo.
 */
export type Localized<T> = { en: T } & Partial<Record<Locale, T>>;

/** Testo disponibile in una o più lingue, con `en` garantito. */
export type LocalizedText = Localized<string>;

/** Personalizzazione grafica per ogni B&B (colonna jsonb `theme`). */
export interface BnbTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  /**
   * Colore del testo principale (`--foreground`). Opzionale: se assente si usa
   * il default della palette (le strutture create prima della Fase 3 non lo
   * hanno, e restano identiche).
   */
  textColor?: string;
  /**
   * Colore delle superfici "di sezione" (`--secondary`): gli sfondi chiari
   * dietro le icone/chip e i widget. Opzionale, come `textColor`.
   */
  sectionColor?: string;
  logoUrl: string;
  heroImage: string;
}

/** Servizi attivabili/disattivabili (colonna jsonb `toggles`). */
export interface BnbToggles {
  hasKitchen: boolean;
  hasParking: boolean;
  offersBreakfast: boolean;
}

export interface HouseRule {
  id: string;
  /** Emoji usata come icona a colpo d'occhio. */
  icon: string;
  text: string;
}

/** Contenuti testuali in una singola lingua (dentro il jsonb `content`). */
export interface BnbContent {
  welcomeMessage: string;
  wifiNetworkName: string;
  wifiPassword: string;
  checkIn: string;
  checkOut: string;
  houseRules: HouseRule[];
}

/** Istruzioni di trasporto in una singola lingua (dentro il jsonb `location`). */
export interface BnbLocation {
  airport: string;
  train: string;
  ztl: string;
}

/** Entità principale: un B&B. Corrisponde a una riga di `bnb_clients`. */
export interface Bnb {
  id: string;
  name: string;
  theme: BnbTheme;
  toggles: BnbToggles;
  content: Localized<BnbContent>;
  location: Localized<BnbLocation>;
  /** Indirizzo "neutro" per l'embed della mappa (colonna `address`). */
  address: string;
  /** Telefono dell'host per i link `tel:` (colonna `host_phone`). */
  hostPhone: string;
  /**
   * Numero WhatsApp dell'host per i link `wa.me`: solo cifre con prefisso
   * internazionale, senza `+` (colonna `host_whatsapp`).
   */
  hostWhatsapp: string;
}

/** Categoria di un posto consigliato dall'host. */
export type PlaceCategory = "ristorante" | "bar" | "servizio";

/**
 * Posto consigliato (ristorante, bar o servizio).
 * Tabella `restaurants` separata, con FK `bnbId` (bnb_client_id su Supabase).
 */
export interface Place {
  id: string;
  bnbId: string;
  category: PlaceCategory;
  name: LocalizedText;
  /** La citazione/raccomandazione dell'host. */
  description: LocalizedText;
  /** Durata a piedi, es. "5 min" (il suffisso viene localizzato nella UI). */
  walkingDistance: string;
  imageUrl: string;
  googleMapsUrl: string;
  /** Ordine di presentazione nella lista (crescente). Colonna `sort_order`. */
  sortOrder: number;
}
