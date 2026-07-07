import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { EditorSection } from "@/components/admin/form-bits";
import { GeneralForm } from "@/components/admin/general-form";
import { PlacesEditor } from "@/components/admin/places-editor";
import { getOwnedBnb, getOwnedBnbPlaces } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Modifica struttura",
  robots: { index: false, follow: false },
};

// Area riservata: sempre dinamica, mai prerenderizzata.
export const dynamic = "force-dynamic";

interface EditBnbPageProps {
  params: Promise<{ bnbId: string }>;
}

export default async function EditBnbPage({ params }: EditBnbPageProps) {
  const { bnbId } = await params;

  // getOwnedBnb fa requireUser + filtra per owner_id: null = non tua / assente.
  const bnb = await getOwnedBnb(bnbId);
  if (!bnb) notFound();

  const places = await getOwnedBnbPlaces(bnbId);

  return (
    <AdminShell title={bnb.name} subtitle={`/${bnb.id}`} backHref="/admin">
      <div className="space-y-10">
        <div>
          <Link
            href={`/${bnb.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden />
            Apri la pagina ospite
          </Link>
        </div>

        <EditorSection
          title="Dati generali"
          description="Nome, colori del tema, servizi, indirizzo e contatti dell'host."
        >
          <GeneralForm bnb={bnb} />
        </EditorSection>

        <EditorSection
          title="Contenuti e trasporti"
          description="Benvenuto, Wi-Fi, check-in/out, regole della casa e indicazioni, in italiano, inglese e spagnolo."
        >
          <ContentEditor bnb={bnb} />
        </EditorSection>

        <EditorSection
          title="Posti consigliati"
          description="Ristoranti, bar e servizi che consigli ai tuoi ospiti."
        >
          <PlacesEditor bnbId={bnb.id} places={places} />
        </EditorSection>
      </div>
    </AdminShell>
  );
}
