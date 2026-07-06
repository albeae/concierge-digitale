import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BnbGuide } from "@/components/bnb-guide";
import { getBnb, getBnbIds, getPlaces } from "@/lib/mock-data";

interface BnbPageProps {
  params: Promise<{ bnbId: string }>;
}

/** Pre-genera una pagina statica per ogni B&B conosciuto. */
export function generateStaticParams() {
  return getBnbIds().map((bnbId) => ({ bnbId }));
}

export async function generateMetadata({
  params,
}: BnbPageProps): Promise<Metadata> {
  const { bnbId } = await params;
  const bnb = getBnb(bnbId);
  if (!bnb) return {};

  return {
    title: { absolute: bnb.name },
    // `it` è opzionale nel tipo Localized: se manca, si usa la base `en`.
    description: (bnb.content.it ?? bnb.content.en).welcomeMessage,
  };
}

export default async function BnbPage({ params }: BnbPageProps) {
  const { bnbId } = await params;
  const bnb = getBnb(bnbId);

  if (!bnb) notFound();

  const places = getPlaces(bnbId);

  return <BnbGuide bnb={bnb} places={places} />;
}
