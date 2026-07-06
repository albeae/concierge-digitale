/**
 * Etichette dell'interfaccia (chrome) nelle due lingue.
 * I contenuti veri e propri stanno nei dati (`mock-data.ts`); qui ci sono
 * solo i testi fissi della UI, così che cambiando lingua cambi tutto: sia i
 * contenuti sia i titoli delle sezioni, le tab e i pulsanti.
 */
import type { Locale, PlaceCategory } from "@/types";

interface TransportItemMeta {
  icon: string;
  label: string;
}

export interface UiStrings {
  languageLabel: string;
  tabs: { home: string; explore: string; info: string };
  amenities: {
    kitchen: string;
    parking: string;
    breakfast: string;
    available: string;
    unavailable: string;
    kitchenDesc: string;
    parkingDesc: string;
    breakfastDesc: string;
  };
  wifi: {
    title: string;
    network: string;
    password: string;
    copy: string;
    copied: string;
    copyAria: (field: string) => string;
  };
  rules: { title: string };
  transport: {
    title: string;
    mapAria: string;
    ztlBadge: string;
    items: { airport: TransportItemMeta; train: TransportItemMeta; ztl: TransportItemMeta };
  };
  recycling: {
    title: string;
    bins: {
      organic: string;
      paper: string;
      plastic: string;
      glass: string;
      general: string;
    };
  };
  places: {
    previewTitle: string;
    exploreTitle: string;
    seeAll: string;
    openMaps: string;
    walk: string;
    empty: string;
    filterAll: string;
    /** Etichetta di categoria al plurale, per i filtri. */
    filters: Record<PlaceCategory, string>;
    /** Etichetta di categoria al singolare, per il badge sulla card. */
    categoryLabel: Record<PlaceCategory, string>;
  };
  info: {
    title: string;
    servicesTitle: string;
    contactTitle: string;
    contactBody: string;
    checkInOutTitle: string;
    checkIn: string;
    checkOut: string;
  };
  widgets: {
    weather: string;
    weatherCondition: string;
    time: string;
  };
  actions: {
    whatsapp: string;
    call: string;
  };
  review: {
    title: string;
    prompt: string;
    placeholder: string;
    submit: string;
    thanks: string;
    starAria: (n: number) => string;
  };
  emergency: {
    title: string;
    subtitle: string;
    emergencyNumber: string;
    callHost: string;
    pharmacy: string;
    directions: string;
  };
}

export const ui: Record<Locale, UiStrings> = {
  it: {
    languageLabel: "Lingua",
    tabs: { home: "Home", explore: "Esplora", info: "Info" },
    amenities: {
      kitchen: "Cucina",
      parking: "Parcheggio",
      breakfast: "Colazione inclusa",
      available: "Disponibile",
      unavailable: "Non disponibile",
      kitchenDesc: "Cucina attrezzata a disposizione degli ospiti: pentole, stoviglie e piano cottura.",
      parkingDesc: "Posto auto riservato, su richiesta e in base alla disponibilità.",
      breakfastDesc: "Colazione inclusa, servita ogni mattina con prodotti freschi e locali.",
    },
    wifi: {
      title: "Wi-Fi",
      network: "Rete",
      password: "Password",
      copy: "Copia",
      copied: "Copiato!",
      copyAria: (field) => `Copia ${field.toLowerCase()}`,
    },
    rules: { title: "Regole della casa" },
    transport: {
      title: "Location & Trasporti",
      mapAria: "Mappa della struttura",
      ztlBadge: "Attenzione ZTL",
      items: {
        airport: { icon: "✈️", label: "In Aereo" },
        train: { icon: "🚆", label: "In Treno" },
        ztl: { icon: "🚗", label: "In Auto" },
      },
    },
    recycling: {
      title: "Raccolta differenziata",
      bins: {
        organic: "Organico",
        paper: "Carta e cartone",
        plastic: "Plastica e lattine",
        glass: "Vetro",
        general: "Indifferenziato",
      },
    },
    places: {
      previewTitle: "Dove mangiare",
      exploreTitle: "Esplora la zona",
      seeAll: "Vedi tutti",
      openMaps: "Apri in Google Maps",
      walk: "a piedi",
      empty: "Nessun posto in questa categoria.",
      filterAll: "Tutti",
      filters: {
        ristorante: "Ristoranti",
        bar: "Bar",
        servizio: "Servizi",
      },
      categoryLabel: {
        ristorante: "Ristorante",
        bar: "Bar",
        servizio: "Servizio",
      },
    },
    info: {
      title: "Info",
      servicesTitle: "Servizi della struttura",
      contactTitle: "Contatti",
      contactBody:
        "Per qualsiasi necessità durante il soggiorno siamo a tua disposizione: scrivici o chiamaci. In caso di emergenza componi il 112 (numero unico europeo).",
      checkInOutTitle: "Check-in & Check-out",
      checkIn: "Check-in",
      checkOut: "Check-out",
    },
    widgets: {
      weather: "Meteo",
      weatherCondition: "Soleggiato",
      time: "Ora locale",
    },
    actions: {
      whatsapp: "WhatsApp Host",
      call: "Chiama",
    },
    review: {
      title: "Com'è andato il soggiorno?",
      prompt: "Lascia una valutazione, ci aiuta tantissimo.",
      placeholder: "Raccontaci cosa possiamo migliorare…",
      submit: "Invia feedback",
      thanks: "Grazie per il tuo feedback!",
      starAria: (n) => `${n} stelle su 5`,
    },
    emergency: {
      title: "Emergenze",
      subtitle: "Numeri utili, sempre a portata di mano.",
      emergencyNumber: "Emergenze (numero unico)",
      callHost: "Chiama l'host",
      pharmacy: "Farmacia più vicina",
      directions: "Apri indicazioni",
    },
  },
  en: {
    languageLabel: "Language",
    tabs: { home: "Home", explore: "Explore", info: "Info" },
    amenities: {
      kitchen: "Kitchen",
      parking: "Parking",
      breakfast: "Breakfast included",
      available: "Available",
      unavailable: "Not available",
      kitchenDesc: "A fully equipped kitchen for guests: pots, dishes and a stovetop.",
      parkingDesc: "A reserved parking space, on request and subject to availability.",
      breakfastDesc: "Breakfast included, served every morning with fresh, local products.",
    },
    wifi: {
      title: "Wi-Fi",
      network: "Network",
      password: "Password",
      copy: "Copy",
      copied: "Copied!",
      copyAria: (field) => `Copy ${field.toLowerCase()}`,
    },
    rules: { title: "House rules" },
    transport: {
      title: "Location & Transport",
      mapAria: "Map of the property",
      ztlBadge: "ZTL warning",
      items: {
        airport: { icon: "✈️", label: "By Air" },
        train: { icon: "🚆", label: "By Train" },
        ztl: { icon: "🚗", label: "By Car" },
      },
    },
    recycling: {
      title: "Waste sorting",
      bins: {
        organic: "Food waste",
        paper: "Paper & card",
        plastic: "Plastic & cans",
        glass: "Glass",
        general: "General waste",
      },
    },
    places: {
      previewTitle: "Where to eat",
      exploreTitle: "Explore the area",
      seeAll: "See all",
      openMaps: "Open in Google Maps",
      walk: "walk",
      empty: "No places in this category.",
      filterAll: "All",
      filters: {
        ristorante: "Restaurants",
        bar: "Bars",
        servizio: "Services",
      },
      categoryLabel: {
        ristorante: "Restaurant",
        bar: "Bar",
        servizio: "Service",
      },
    },
    info: {
      title: "Info",
      servicesTitle: "What the place offers",
      contactTitle: "Contacts",
      contactBody:
        "We're here for you throughout your stay: message or call us anytime. In an emergency dial 112 (single European number).",
      checkInOutTitle: "Check-in & Check-out",
      checkIn: "Check-in",
      checkOut: "Check-out",
    },
    widgets: {
      weather: "Weather",
      weatherCondition: "Sunny",
      time: "Local time",
    },
    actions: {
      whatsapp: "WhatsApp Host",
      call: "Call",
    },
    review: {
      title: "How was your stay?",
      prompt: "Leave a rating, it helps us a lot.",
      placeholder: "Tell us what we can improve…",
      submit: "Send feedback",
      thanks: "Thanks for your feedback!",
      starAria: (n) => `${n} out of 5 stars`,
    },
    emergency: {
      title: "Emergencies",
      subtitle: "Helpful numbers, always within reach.",
      emergencyNumber: "Emergencies (single number)",
      callHost: "Call the host",
      pharmacy: "Nearest pharmacy",
      directions: "Open directions",
    },
  },
  es: {
    languageLabel: "Idioma",
    tabs: { home: "Inicio", explore: "Explorar", info: "Info" },
    amenities: {
      kitchen: "Cocina",
      parking: "Aparcamiento",
      breakfast: "Desayuno incluido",
      available: "Disponible",
      unavailable: "No disponible",
      kitchenDesc: "Cocina equipada a disposición de los huéspedes: ollas, vajilla y placa de cocina.",
      parkingDesc: "Plaza de aparcamiento reservada, bajo petición y según disponibilidad.",
      breakfastDesc: "Desayuno incluido, servido cada mañana con productos frescos y locales.",
    },
    wifi: {
      title: "Wi-Fi",
      network: "Red",
      password: "Contraseña",
      copy: "Copiar",
      copied: "¡Copiado!",
      copyAria: (field) => `Copiar ${field.toLowerCase()}`,
    },
    rules: { title: "Normas de la casa" },
    transport: {
      title: "Ubicación y transporte",
      mapAria: "Mapa del alojamiento",
      ztlBadge: "Atención ZTL",
      items: {
        airport: { icon: "✈️", label: "En avión" },
        train: { icon: "🚆", label: "En tren" },
        ztl: { icon: "🚗", label: "En coche" },
      },
    },
    recycling: {
      title: "Recogida selectiva",
      bins: {
        organic: "Orgánico",
        paper: "Papel y cartón",
        plastic: "Plástico y latas",
        glass: "Vidrio",
        general: "Resto",
      },
    },
    places: {
      previewTitle: "Dónde comer",
      exploreTitle: "Explora la zona",
      seeAll: "Ver todos",
      openMaps: "Abrir en Google Maps",
      walk: "a pie",
      empty: "No hay lugares en esta categoría.",
      filterAll: "Todos",
      filters: {
        ristorante: "Restaurantes",
        bar: "Bares",
        servizio: "Servicios",
      },
      categoryLabel: {
        ristorante: "Restaurante",
        bar: "Bar",
        servizio: "Servicio",
      },
    },
    info: {
      title: "Info",
      servicesTitle: "Servicios del alojamiento",
      contactTitle: "Contacto",
      contactBody:
        "Estamos a tu disposición durante toda la estancia: escríbenos o llámanos. En caso de emergencia marca el 112 (número único europeo).",
      checkInOutTitle: "Entrada y salida",
      checkIn: "Entrada",
      checkOut: "Salida",
    },
    widgets: {
      weather: "Clima",
      weatherCondition: "Soleado",
      time: "Hora local",
    },
    actions: {
      whatsapp: "WhatsApp anfitrión",
      call: "Llamar",
    },
    review: {
      title: "¿Qué tal tu estancia?",
      prompt: "Déjanos una valoración, nos ayuda muchísimo.",
      placeholder: "Cuéntanos qué podemos mejorar…",
      submit: "Enviar comentarios",
      thanks: "¡Gracias por tus comentarios!",
      starAria: (n) => `${n} de 5 estrellas`,
    },
    emergency: {
      title: "Emergencias",
      subtitle: "Números útiles, siempre a mano.",
      emergencyNumber: "Emergencias (número único)",
      callHost: "Llamar al anfitrión",
      pharmacy: "Farmacia más cercana",
      directions: "Abrir indicaciones",
    },
  },
};
