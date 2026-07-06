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

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
