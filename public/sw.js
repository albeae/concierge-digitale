/*
 * Service worker della PWA "Concierge Digitale".
 * Obiettivo: le informazioni essenziali (Wi-Fi, regole, contatti, trasporti)
 * restano visibili anche offline dopo la prima visita — caso d'uso tipico:
 * Wi-Fi che cade o ospite in camera senza dati mobili.
 *
 * Strategie:
 *  - navigazioni (pagine): network-first, con fallback alla pagina in cache
 *    (o alla home) quando si è offline;
 *  - asset statici (JS/CSS/immagini/manifest): stale-while-revalidate — si
 *    serve subito la copia in cache e la si aggiorna in background.
 * Registrato solo in produzione da ServiceWorkerRegister.
 */
const CACHE = "concierge-v2";

// Shell dell'app da precaricare all'installazione (la root reindirizza al B&B;
// le pagine dei singoli B&B vengono comunque cachate a runtime alla prima visita).
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
  "/hero-trastevere.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Precache "best effort": una singola URL mancante non fa fallire l'install.
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Pagine: prova la rete, altrimenti mostra la versione in cache (o la home).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/")),
        ),
    );
    return;
  }

  // Asset: stale-while-revalidate (risposta immediata dalla cache, refresh dietro).
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
