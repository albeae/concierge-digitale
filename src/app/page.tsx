import { notFound, redirect } from "next/navigation";
import { getBnbIds } from "@/lib/data";

/** Come per la pagina B&B: rigenerata al massimo ogni 5 minuti. */
export const revalidate = 300;

/**
 * In Fase 2 c'è un solo B&B: la root reindirizza alla sua pagina (il primo
 * per data di creazione). Se il database è vuoto (schema non ancora
 * applicato), risponde 404 invece di rompersi. Con il multi-tenant qui ci
 * potrà stare una landing o l'elenco delle strutture.
 */
export default async function Home() {
  const [firstBnbId] = await getBnbIds();
  if (!firstBnbId) notFound();
  redirect(`/${firstBnbId}`);
}
