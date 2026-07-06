import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Web App Manifest generato da Next.js (esposto su /manifest.webmanifest).
 * Rende l'app installabile come PWA su mobile e desktop.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Concierge Digitale",
    short_name: "Concierge",
    description:
      "La guida digitale della tua struttura: Wi-Fi, regole della casa, trasporti e ristoranti in zona.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND.background,
    theme_color: BRAND.primary,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
