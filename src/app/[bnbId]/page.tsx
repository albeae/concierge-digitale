import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BnbGuide } from "@/components/bnb-guide";
import { getBnb, getBnbIds, getPlaces } from "@/lib/data";

interface BnbPageProps {
  params: Promise<{ bnbId: string }>;
}

/**
 * ISR: la pagina resta statica ma viene rigenerata al massimo ogni 5 minuti,
 * così le modifiche fatte a mano su Supabase compaiono senza redeploy.
 */
export const revalidate = 300;

/**
 * Pre-genera una pagina statica per ogni B&B presente nel database al momento
 * della build. Gli slug non conosciuti (B&B aggiunti dopo) vengono comunque
 * renderizzati alla prima richiesta (`dynamicParams` è true di default).
 */
export async function generateStaticParams() {
  const ids = await getBnbIds();
  return ids.map((bnbId) => ({ bnbId }));
}

export async function generateMetadata({
  params,
}: BnbPageProps): Promise<Metadata> {
  const { bnbId } = await params;
  const bnb = await getBnb(bnbId);
  if (!bnb) return {};

  return {
    title: { absolute: bnb.name },
    // `it` è opzionale nel tipo Localized: se manca, si usa la base `en`.
    description: (bnb.content.it ?? bnb.content.en).welcomeMessage,
  };
}

export default async function BnbPage({ params }: BnbPageProps) {
  const { bnbId } = await params;
  const bnb = await getBnb(bnbId);

  if (!bnb) notFound();

  const places = await getPlaces(bnbId);

  return <BnbGuide bnb={bnb} places={places} />;
}
