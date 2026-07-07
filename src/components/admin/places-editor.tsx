"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { deletePlace, upsertPlace } from "@/app/admin/[bnbId]/actions";
import { FieldRow, Input, Label, Select, Textarea } from "@/components/admin/field";
import { StatusMessage } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Place, PlaceCategory } from "@/types";

const CATEGORIES: { value: PlaceCategory; label: string }[] = [
  { value: "ristorante", label: "Ristorante" },
  { value: "bar", label: "Bar" },
  { value: "servizio", label: "Servizio" },
];

/** Form di un singolo posto: senza `place` è il form "aggiungi nuovo". */
function PlaceForm({
  bnbId,
  place,
  defaultSortOrder,
}: {
  bnbId: string;
  place?: Place;
  defaultSortOrder?: number;
}) {
  const isNew = !place;
  const upsert = upsertPlace.bind(null, bnbId);
  const [state, formAction, pending] = useActionState(upsert, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Dopo aver aggiunto un posto, svuota il form "nuovo" per il prossimo.
  useEffect(() => {
    if (state?.ok && isNew) formRef.current?.reset();
  }, [state, isNew]);

  return (
    <Card>
      <CardContent className="p-5">
        <form ref={formRef} action={formAction} className="space-y-4">
          {place && <input type="hidden" name="place_id" value={place.id} />}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <FieldRow label="Categoria" htmlFor={`cat-${place?.id ?? "new"}`}>
              <Select
                id={`cat-${place?.id ?? "new"}`}
                name="category"
                defaultValue={place?.category ?? "ristorante"}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow
              label="Ordine"
              htmlFor={`sort-${place?.id ?? "new"}`}
              hint="Più basso = prima."
            >
              <Input
                id={`sort-${place?.id ?? "new"}`}
                name="sort_order"
                type="number"
                defaultValue={place?.sortOrder ?? defaultSortOrder ?? 0}
                className="w-24"
              />
            </FieldRow>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldRow label="Nome (IT)" htmlFor={`nit-${place?.id ?? "new"}`}>
              <Input
                id={`nit-${place?.id ?? "new"}`}
                name="name_it"
                defaultValue={place?.name.it ?? ""}
              />
            </FieldRow>
            <FieldRow label="Nome (EN) — obbligatorio" htmlFor={`nen-${place?.id ?? "new"}`}>
              <Input
                id={`nen-${place?.id ?? "new"}`}
                name="name_en"
                defaultValue={place?.name.en ?? ""}
                required
              />
            </FieldRow>
          </div>

          <div className="space-y-2">
            <Label>Descrizione (consiglio dell&apos;host)</Label>
            <div className="grid gap-2">
              <Textarea
                name="description_it"
                aria-label="Descrizione IT"
                placeholder="Italiano"
                defaultValue={place?.description.it ?? ""}
                className="min-h-16"
              />
              <Textarea
                name="description_en"
                aria-label="Descrizione EN"
                placeholder="English (base)"
                defaultValue={place?.description.en ?? ""}
                className="min-h-16"
              />
              <Textarea
                name="description_es"
                aria-label="Descrizione ES"
                placeholder="Español"
                defaultValue={place?.description.es ?? ""}
                className="min-h-16"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldRow
              label="Distanza a piedi"
              htmlFor={`wd-${place?.id ?? "new"}`}
              hint='Valore neutro, es. "5 min".'
            >
              <Input
                id={`wd-${place?.id ?? "new"}`}
                name="walking_distance"
                defaultValue={place?.walkingDistance ?? ""}
              />
            </FieldRow>
            <FieldRow label="Immagine (URL)" htmlFor={`img-${place?.id ?? "new"}`}>
              <Input
                id={`img-${place?.id ?? "new"}`}
                name="image_url"
                defaultValue={place?.imageUrl ?? ""}
              />
            </FieldRow>
          </div>

          <FieldRow label="Link Google Maps" htmlFor={`gm-${place?.id ?? "new"}`}>
            <Input
              id={`gm-${place?.id ?? "new"}`}
              name="google_maps_url"
              defaultValue={place?.googleMapsUrl ?? ""}
              inputMode="url"
            />
          </FieldRow>

          <StatusMessage state={state} />

          <Button
            type="submit"
            disabled={pending}
            className="h-11 gap-2 rounded-2xl bg-terracotta px-5 font-semibold text-primary-foreground hover:bg-terracotta-strong"
          >
            {isNew ? <Plus className="size-4" aria-hidden /> : <Save className="size-4" aria-hidden />}
            {pending ? "Salvataggio…" : isNew ? "Aggiungi posto" : "Salva posto"}
          </Button>
        </form>

        {/* Elimina: form separato (niente form annidati nell'HTML). */}
        {place && <DeletePlaceForm bnbId={bnbId} place={place} />}
      </CardContent>
    </Card>
  );
}

function DeletePlaceForm({ bnbId, place }: { bnbId: string; place: Place }) {
  const del = deletePlace.bind(null, bnbId);
  const [state, formAction, pending] = useActionState(del, undefined);
  const name = place.name.it ?? place.name.en;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`Eliminare "${name}"? L'azione è definitiva.`)) {
          e.preventDefault();
        }
      }}
      className="mt-3 flex items-center gap-3 border-t border-border pt-3"
    >
      <input type="hidden" name="place_id" value={place.id} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={pending}
        className="gap-1.5 rounded-lg"
      >
        <Trash2 className="size-4" aria-hidden />
        {pending ? "Elimino…" : "Elimina"}
      </Button>
      <StatusMessage state={state} />
    </form>
  );
}

export function PlacesEditor({
  bnbId,
  places,
}: {
  bnbId: string;
  places: Place[];
}) {
  const nextSort = places.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1;

  return (
    <div className="space-y-4">
      {places.map((place) => (
        <PlaceForm key={place.id} bnbId={bnbId} place={place} />
      ))}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Aggiungi un nuovo posto
        </h3>
        <PlaceForm bnbId={bnbId} defaultSortOrder={nextSort} />
      </div>
    </div>
  );
}
