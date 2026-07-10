"use client";

import { useEffect } from "react";

/**
 * Registra il service worker (/sw.js) solo in produzione.
 * In sviluppo lo saltiamo per evitare caching aggressivo durante l'hot reload.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* la registrazione non è critica: ignoriamo eventuali errori */
      });
    };

    // Se il documento ha già finito di caricare (risorse in cache, rete
    // veloce) l'evento "load" è già scattato PRIMA che questo effect si
    // montasse: un addEventListener("load", ...) tardivo non lo intercetta
    // mai più, e il service worker non si registrerebbe finché la pagina non
    // viene rivisitata... cosa che in pratica non succede mai da sola.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
