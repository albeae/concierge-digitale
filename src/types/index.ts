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
   * hanno, e restano identiche). Lo stesso vale per gli altri colori opzionali
   * qui sotto.
   */
  textColor?: string;
  /**
   * Colore di testo e icone SOPRA il colore principale (`--primary-foreground`):
   * nome nell'header, selettore lingua, scritte e pulsante della card Wi-Fi,
   * pulsanti brand, badge. Di solito un colore chiaro che contrasta col
   * principale.
   */
  primaryForeground?: string;
  /** Colore del testo secondario/grigio (`--muted-foreground`): didascalie, etichette. */
  mutedColor?: string;
  /** Sfondo delle card/sezioni (`--card`, `--popover`). */
  cardColor?: string;
  /** Sfondo delle icone/chip e dei widget (`--secondary`, `--accent`). */
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
  /** Orario di check-in, es. "Dalle 14:00 alle 20:00". */
  checkIn: string;
  /** Orario di check-out, es. "Entro le 10:30". */
  checkOut: string;
  /**
   * Istruzioni di arrivo / self check-in in testo libero (multilinea): come
   * raggiungere l'ingresso, piano, citofono, dove ritirare le chiavi.
   * ⚠️ MAI codici di accesso (portone, keybox, PIN allarme): la pagina ospite
   * è pubblica con URL permanente e lettura anon via RLS — un codice salvato
   * qui è un accesso fisico regalato. I codici si mandano via WhatsApp
   * (vedi CLAUDE.md, errore n. 18). Opzionale: se vuoto la card mostra solo
   * l'orario; le righe a capo si conservano (`whitespace-pre-line`).
   */
  checkInInstructions: string;
  /** Cosa fare alla partenza: dove lasciare le chiavi, rifiuti. Come sopra, opzionale e multilinea. */
  checkOutInstructions: string;
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
  /**
   * Link "lascia una recensione su Google" della struttura (colonna
   * `google_reviews_url`). Se vuoto, il modulo recensioni ringrazia soltanto
   * senza aprire nulla.
   */
  googleReviewsUrl: string;
}

/**
 * Feedback privato lasciato da un ospite (tabella `guest_feedback`).
 * Solo i voti 1-3: i voti alti vengono dirottati su Google Reviews e non
 * passano dal database. L'ospite scrive, solo il titolare legge.
 */
export interface GuestFeedback {
  id: string;
  bnbId: string;
  /** Voto 1-3 (su una scala a 5 stelle mostrata all'ospite). */
  rating: number;
  message: string;
  /** ISO timestamp di quando l'ospite ha inviato il feedback. */
  createdAt: string;
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
