import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { BRAND } from "@/lib/brand";

// Coppia tipografica del restyling "Roma centro": Nunito Sans (umanista, molto
// leggibile su mobile) per il testo, Fraunces (serif caldo) SOLO per i titoli
// via token --font-heading. Entrambi variable font: un file per famiglia.
const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Concierge Digitale",
  title: {
    default: "Concierge Digitale",
    template: "%s · Concierge Digitale",
  },
  description:
    "La guida digitale della tua struttura: Wi-Fi, regole della casa, trasporti e ristoranti in zona.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Concierge",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Niente `maximumScale`/`userScalable`: il pinch-zoom resta libero — l'utenza
  // sono turisti che devono poter ingrandire Wi-Fi, regole e indirizzi.
  viewportFit: "cover",
  themeColor: BRAND.primary,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${nunitoSans.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
