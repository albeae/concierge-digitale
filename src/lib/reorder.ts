/**
 * Logica pura del riordino dei posti (usata da `movePlace`).
 *
 * Estratta qui perché il calcolo "sposta un elemento su/giù" è facile da
 * sbagliare con ordini duplicati o buchi nella numerazione: isolarlo lo rende
 * testabile senza database.
 *
 * Strategia: dopo lo scambio, RINORMALIZZA l'intera lista su 0..n-1 nell'ordine
 * desiderato e restituisce solo le righe il cui valore cambia davvero. Così un
 * qualsiasi stato di partenza (duplicati, gap, valori negativi) torna pulito e
 * lo spostamento non trascina mai altri posti.
 */
export interface ReorderItem {
  id: string;
  sortOrder: number;
}

/**
 * Calcola i nuovi `sort_order` dopo aver spostato `placeId` di una posizione.
 * `ordered` deve arrivare già ordinato come lo vede l'utente (sort_order, poi
 * id). Ritorna SOLO gli elementi da aggiornare ({id, sortOrder}); vuoto se il
 * posto non esiste o è già al bordo (niente da fare).
 */
export function computeReorder(
  ordered: ReorderItem[],
  placeId: string,
  direction: "up" | "down",
): ReorderItem[] {
  const idx = ordered.findIndex((p) => p.id === placeId);
  if (idx === -1) return [];

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ordered.length) return [];

  const next = ordered.slice();
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

  // Riassegna 0..n-1 nell'ordine nuovo; aggiorna solo chi cambia valore.
  const updates: ReorderItem[] = [];
  next.forEach((p, i) => {
    if (p.sortOrder !== i) updates.push({ id: p.id, sortOrder: i });
  });
  return updates;
}
