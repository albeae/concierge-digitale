/**
 * Dati finti allineati allo schema Supabase definitivo (vedi CLAUDE.md).
 * Fase 1 dell'MVP: nessun database, tutto scritto qui nel codice.
 *
 * - `bnbs`: mappa id -> B&B (tabella `bnb_clients`), pronta per il dynamic
 *   routing `app/[bnbId]`.
 * - `places`: posti consigliati (tabella `restaurants` separata, FK `bnbId`),
 *   ognuno bilingue e con categoria (ristorante | bar | servizio).
 */
import type { Bnb, Place } from "@/types";

export type {
  Bnb,
  HouseRule,
  Locale,
  LocalizedText,
  Place,
  PlaceCategory,
} from "@/types";

const casaRossa: Bnb = {
  id: "casa-rossa",
  name: "Casa Rossa",
  theme: {
    primaryColor: "#b85c3c",
    secondaryColor: "#d99a3c",
    backgroundColor: "#fbf4ea",
    logoUrl: "/icon.svg",
    heroImage: "/hero-trastevere.svg",
  },
  toggles: {
    hasKitchen: true,
    hasParking: false,
    offersBreakfast: true,
  },
  content: {
    it: {
      welcomeMessage:
        "Benvenuti a Casa Rossa, nel cuore di Trastevere! Qui trovate tutto il necessario per il vostro soggiorno: rete Wi-Fi, regole della casa e come muovervi in città.",
      wifiNetworkName: "CasaRossa_Guest",
      wifiPassword: "trastevere2026",
      checkIn: "Dalle 14:00 alle 20:00",
      checkOut: "Entro le 10:30",
      houseRules: [
        {
          id: "rule-quiet",
          icon: "🤫",
          text: "Silenzio dalle 23:00 alle 8:00: siamo in un palazzo abitato, rispettate i vicini.",
        },
        {
          id: "rule-smoking",
          icon: "🚭",
          text: "Vietato fumare all'interno. Potete fumare alla finestra o in strada.",
        },
        {
          id: "rule-guests",
          icon: "👥",
          text: "Non sono ammessi ospiti esterni non registrati durante il soggiorno.",
        },
        {
          id: "rule-energy",
          icon: "💡",
          text: "Spegnete luci e aria condizionata quando uscite: aiutate l'ambiente (e Roma d'estate scotta).",
        },
        {
          id: "rule-keys",
          icon: "🔑",
          text: "Portate sempre le chiavi con voi: il portone si chiude automaticamente.",
        },
        {
          id: "rule-emergency",
          icon: "🆘",
          text: "Emergenze: 112 (numero unico). Per qualsiasi problema in casa, chiamateci.",
        },
      ],
    },
    en: {
      welcomeMessage:
        "Welcome to Casa Rossa, in the heart of Trastevere! Here you'll find everything you need for your stay: the Wi-Fi, the house rules and how to get around the city.",
      wifiNetworkName: "CasaRossa_Guest",
      wifiPassword: "trastevere2026",
      checkIn: "From 2:00 PM to 8:00 PM",
      checkOut: "By 10:30 AM",
      houseRules: [
        {
          id: "rule-quiet",
          icon: "🤫",
          text: "Quiet hours from 11:00 PM to 8:00 AM: this is a residential building, please respect the neighbours.",
        },
        {
          id: "rule-smoking",
          icon: "🚭",
          text: "No smoking indoors. You may smoke by the window or out on the street.",
        },
        {
          id: "rule-guests",
          icon: "👥",
          text: "Outside guests who aren't registered are not allowed during your stay.",
        },
        {
          id: "rule-energy",
          icon: "💡",
          text: "Turn off lights and air conditioning when you go out: help the planet (and Rome gets hot in summer).",
        },
        {
          id: "rule-keys",
          icon: "🔑",
          text: "Always take the keys with you: the main door locks automatically.",
        },
        {
          id: "rule-emergency",
          icon: "🆘",
          text: "Emergencies: 112 (single European number). For any issue in the flat, call us.",
        },
      ],
    },
    es: {
      welcomeMessage:
        "¡Bienvenidos a Casa Rossa, en el corazón del Trastevere! Aquí encontraréis todo lo necesario para vuestra estancia: la red Wi-Fi, las normas de la casa y cómo moveros por la ciudad.",
      wifiNetworkName: "CasaRossa_Guest",
      wifiPassword: "trastevere2026",
      checkIn: "De 14:00 a 20:00",
      checkOut: "Antes de las 10:30",
      houseRules: [
        {
          id: "rule-quiet",
          icon: "🤫",
          text: "Silencio de 23:00 a 8:00: estamos en un edificio habitado, respetad a los vecinos.",
        },
        {
          id: "rule-smoking",
          icon: "🚭",
          text: "Prohibido fumar en el interior. Podéis fumar en la ventana o en la calle.",
        },
        {
          id: "rule-guests",
          icon: "👥",
          text: "No se admiten invitados externos no registrados durante la estancia.",
        },
        {
          id: "rule-energy",
          icon: "💡",
          text: "Apagad luces y aire acondicionado al salir: ayudad al medio ambiente (y en verano Roma quema).",
        },
        {
          id: "rule-keys",
          icon: "🔑",
          text: "Llevad siempre las llaves con vosotros: el portal se cierra automáticamente.",
        },
        {
          id: "rule-emergency",
          icon: "🆘",
          text: "Emergencias: 112 (número único). Ante cualquier problema en la casa, llamadnos.",
        },
      ],
    },
  },
  location: {
    it: {
      airport:
        "Il modo più semplice: prendete il treno regionale FL1 (direzione Orte / Fara Sabina) direttamente dall'aeroporto di Fiumicino e scendete alla stazione 'Roma Trastevere' — circa 30 minuti, 8€, biglietto alle macchinette o sull'app Trenitalia. Dalla stazione siete a 10 minuti a piedi da Casa Rossa. In alternativa il taxi ha una tariffa fissa di 55€ verso il centro storico (compreso Trastevere): pagate quella cifra, non usate il tassametro.",
      train:
        "Da Termini (dove arrivano i treni ad alta velocità e i bus dagli altri aeroporti) a Casa Rossa: prendete il bus H, che ferma davanti alla stazione e vi porta a Trastevere in circa 15 minuti; scendete a 'Sonnino/San Gallicano'. In taxi sono circa 12-15€. Il biglietto del bus (1,50€, valido 100 minuti) si compra in tabaccheria, edicola o sull'app; va convalidato salendo.",
      ztl:
        "Trastevere è una ZTL: l'ingresso in auto è vietato senza permesso e le telecamere multano in automatico (anche le auto a noleggio, la multa arriva a casa). Se arrivate in macchina, NON entrate nella zona: lasciatela in un parcheggio fuori dalla ZTL (es. Gianicolo o lungotevere) e proseguite a piedi. Taxi, NCC e navette autorizzate possono invece entrare tranquillamente.",
    },
    en: {
      airport:
        "The easiest way: take the FL1 regional train (towards Orte / Fara Sabina) straight from Fiumicino airport and get off at 'Roma Trastevere' station — about 30 minutes, €8, tickets from the machines or the Trenitalia app. From the station Casa Rossa is a 10-minute walk. Alternatively a taxi has a fixed fare of €55 to the historic centre (Trastevere included): pay that flat amount, don't use the meter.",
      train:
        "From Termini (where high-speed trains and airport buses arrive) to Casa Rossa: take bus H, which stops in front of the station and reaches Trastevere in about 15 minutes; get off at 'Sonnino/San Gallicano'. A taxi is roughly €12-15. The bus ticket (€1.50, valid 100 minutes) is sold at tobacconists, newsstands or on the app; validate it when you board.",
      ztl:
        "Trastevere is a ZTL (limited traffic zone): driving in without a permit is forbidden and cameras fine you automatically (rental cars too — the fine reaches you at home). If you arrive by car, do NOT enter the zone: leave it in a car park outside the ZTL (e.g. Gianicolo or along the river) and continue on foot. Taxis, private hire and authorised shuttles may enter freely.",
    },
    es: {
      airport:
        "La forma más sencilla: tomad el tren regional FL1 (dirección Orte / Fara Sabina) directamente desde el aeropuerto de Fiumicino y bajad en la estación 'Roma Trastevere' — unos 30 minutos, 8 €, billetes en las máquinas o en la app de Trenitalia. Desde la estación estáis a 10 minutos a pie de Casa Rossa. Como alternativa, el taxi tiene una tarifa fija de 55 € al centro histórico (Trastevere incluido): pagad esa cantidad, no uséis el taxímetro.",
      train:
        "Desde Termini (donde llegan los trenes de alta velocidad y los autobuses de los demás aeropuertos) a Casa Rossa: tomad el autobús H, que para frente a la estación y llega al Trastevere en unos 15 minutos; bajad en 'Sonnino/San Gallicano'. En taxi son unos 12-15 €. El billete de autobús (1,50 €, válido 100 minutos) se compra en estancos, quioscos o en la app; hay que validarlo al subir.",
      ztl:
        "El Trastevere es una ZTL: la entrada en coche está prohibida sin permiso y las cámaras multan automáticamente (también a los coches de alquiler; la multa llega a casa). Si llegáis en coche, NO entréis en la zona: dejadlo en un aparcamiento fuera de la ZTL (p. ej. Gianicolo o los muelles del río) y seguid a pie. Los taxis, VTC y lanzaderas autorizadas sí pueden entrar.",
    },
  },
};

/** Registro dei B&B, indicizzato per id (usato dal dynamic routing). */
export const bnbs: Record<string, Bnb> = {
  [casaRossa.id]: casaRossa,
};

/** Restituisce un B&B dato il suo id (slug dell'URL). */
export function getBnb(id: string): Bnb | undefined {
  return bnbs[id];
}

/** Tutti gli id disponibili, per `generateStaticParams`. */
export function getBnbIds(): string[] {
  return Object.keys(bnbs);
}

/**
 * Posti consigliati (tabella `restaurants` separata su Supabase).
 * Lista piatta: ogni posto porta il suo `bnbId`, come una FK.
 */
export const places: Place[] = [
  {
    id: "place-nonna-rosa",
    bnbId: "casa-rossa",
    category: "ristorante",
    name: { it: "Trattoria da Nonna Rosa", en: "Trattoria da Nonna Rosa" },
    description: {
      it: "Il nostro posto del cuore per la cucina romana verace: cacio e pepe e carbonara come si deve. Chiedete di Rosa da parte nostra!",
      en: "Our favourite spot for proper Roman cooking: cacio e pepe and carbonara done right. Tell Rosa we sent you!",
      es: "Nuestro rincón favorito para la auténtica cocina romana: cacio e pepe y carbonara como Dios manda. ¡Preguntad por Rosa de nuestra parte!",
    },
    walkingDistance: "5 min",
    imageUrl: "",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Trattoria%20da%20Nonna%20Rosa%20Trastevere%20Roma",
  },
  {
    id: "place-forno-vicolo",
    bnbId: "casa-rossa",
    category: "ristorante",
    name: { it: "Il Forno del Vicolo", en: "Il Forno del Vicolo" },
    description: {
      it: "La nostra tappa per un pranzo al volo: pizza bianca e supplì appena sfornati, a due passi da casa.",
      en: "Our go-to for a quick lunch: pizza bianca and supplì fresh out of the oven, just steps from the flat.",
      es: "Nuestra parada para un almuerzo rápido: pizza bianca y supplì recién hechos, a dos pasos de casa.",
    },
    walkingDistance: "3 min",
    imageUrl: "",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Il%20Forno%20del%20Vicolo%20Trastevere%20Roma",
  },
  {
    id: "place-osteria-sisto",
    bnbId: "casa-rossa",
    category: "ristorante",
    name: { it: "Osteria Ponte Sisto", en: "Osteria Ponte Sisto" },
    description: {
      it: "Per una cena speciale: piatti del giorno e ottimi vini laziali. Prenotate, i tavoli volano.",
      en: "For a special dinner: daily specials and great Lazio wines. Book ahead, tables go fast.",
      es: "Para una cena especial: platos del día y excelentes vinos del Lazio. Reservad, las mesas vuelan.",
    },
    walkingDistance: "8 min",
    imageUrl: "",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Osteria%20Ponte%20Sisto%20Trastevere%20Roma",
  },
  {
    id: "place-gelateria-fonte",
    bnbId: "casa-rossa",
    category: "bar",
    name: { it: "Gelateria Fonte d'Argento", en: "Gelateria Fonte d'Argento" },
    description: {
      it: "Il gelato che consigliamo a tutti: provate la crema al miele. Aperti fino a tardi.",
      en: "The gelato we recommend to everyone: try the honey cream. Open late.",
      es: "El helado que recomendamos a todos: probad la crema de miel. Abierto hasta tarde.",
    },
    walkingDistance: "4 min",
    imageUrl: "",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Gelateria%20Fonte%20d'Argento%20Trastevere%20Roma",
  },
  {
    id: "place-enoteca-santa-maria",
    bnbId: "casa-rossa",
    category: "bar",
    name: { it: "Enoteca Santa Maria", en: "Enoteca Santa Maria" },
    description: {
      it: "Il nostro aperitivo preferito al tramonto, con vista sulla piazza e vini al bicchiere.",
      en: "Our favourite sunset aperitivo, overlooking the square, with wines by the glass.",
      es: "Nuestro aperitivo favorito al atardecer, con vistas a la plaza y vinos por copa.",
    },
    walkingDistance: "6 min",
    imageUrl: "",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Enoteca%20Santa%20Maria%20Trastevere%20Roma",
  },
  {
    id: "place-farmacia-gallicano",
    bnbId: "casa-rossa",
    category: "servizio",
    name: { it: "Farmacia San Gallicano", en: "San Gallicano Pharmacy" },
    description: {
      it: "La farmacia più vicina, utile per ogni evenienza. Alcuni farmacisti parlano inglese.",
      en: "The nearest pharmacy, handy for anything you might need. Some pharmacists speak English.",
      es: "La farmacia más cercana, útil para cualquier imprevisto. Algunos farmacéuticos hablan inglés.",
    },
    walkingDistance: "2 min",
    imageUrl: "",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Farmacia%20San%20Gallicano%20Trastevere%20Roma",
  },
  {
    id: "place-alimentari-marco",
    bnbId: "casa-rossa",
    category: "servizio",
    name: { it: "Alimentari da Marco", en: "Da Marco Mini-market" },
    description: {
      it: "Il mini-market dove facciamo la spesa: pane, frutta e prodotti locali. Comodo per la colazione.",
      en: "The mini-market where we do our shopping: bread, fruit and local products. Handy for breakfast.",
      es: "El minimercado donde hacemos la compra: pan, fruta y productos locales. Práctico para el desayuno.",
    },
    walkingDistance: "3 min",
    imageUrl: "",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Alimentari%20Trastevere%20Roma",
  },
];

/** Posti di un B&B (opzionalmente filtrati per categoria). */
export function getPlaces(bnbId: string): Place[] {
  return places.filter((p) => p.bnbId === bnbId);
}
