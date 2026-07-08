import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintSheet } from "@/components/admin/print-sheet";
import { getOwnedBnb } from "@/lib/auth";
import { resolveLocalized } from "@/lib/localize";

export const metadata: Metadata = {
  title: "Stampa scheda QR",
  robots: { index: false, follow: false },
};

// Area riservata: sempre dinamica, mai prerenderizzata.
export const dynamic = "force-dynamic";

interface PrintQrPageProps {
  params: Promise<{ bnbId: string }>;
}

/**
 * Scheda A6 stampabile "Wi-Fi & Guida" (idea n. 3): QR + credenziali Wi-Fi
 * da mettere in camera. Protetta come ogni pagina admin: requireUser +
 * ownership dentro getOwnedBnb, oltre al proxy e alla RLS.
 */
export default async function PrintQrPage({ params }: PrintQrPageProps) {
  const { bnbId } = await params;

  const bnb = await getOwnedBnb(bnbId);
  if (!bnb) notFound();

  // Le credenziali Wi-Fi sono le stesse in tutte le lingue: si prende la
  // versione italiana (con fallback per-chiave su en, come nella guest).
  const content = resolveLocalized(bnb.content, "it");

  return (
    <PrintSheet
      bnbId={bnb.id}
      bnbName={bnb.name}
      wifiNetwork={content.wifiNetworkName}
      wifiPassword={content.wifiPassword}
    />
  );
}
