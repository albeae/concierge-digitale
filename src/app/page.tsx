import { redirect } from "next/navigation";
import { getBnbIds } from "@/lib/mock-data";

/**
 * In Fase 1 c'è un solo B&B: la root reindirizza alla sua pagina.
 * Con il multi-tenant qui ci potrà stare una landing o l'elenco delle strutture.
 */
export default function Home() {
  const [firstBnbId] = getBnbIds();
  redirect(`/${firstBnbId}`);
}
