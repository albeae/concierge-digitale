"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Save, Trash2, X } from "lucide-react";
import { deletePlace, movePlace, upsertPlace } from "@/app/admin/[bnbId]/actions";
import { FieldRow, Input, Label, Select, Textarea } from "@/components/admin/field";
import { StatusMessage } from "@/components/admin/form-bits";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Place, PlaceCategory } from "@/types";

const CATEGORIES: { value: PlaceCategory; label: string }[] = [
  { value: "ristorante", label: "Ristorante" },
  { value: "bar", label: "Bar" },
  { value: "servizio", label: "Servizio" },
];

function categoryLabel(value: PlaceCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/**
 * Corpo del form di un posto (senza Card attorno: lo mette chi lo usa).
 * Senza `place` è il form "aggiungi nuovo". Dopo un salvataggio riuscito
 * ricarica i dati del server (`router.refresh`) così la lista compatta
 * riflette subito la modifica; per il nuovo posto svuota il form e chiude.
 */
function PlaceFormBody({
  bnbId,
  place,
  defaultSortOrder,
  onSaved,
}: {
  bnbId: string;
  place?: Place;
  defaultSortOrder?: number;
  onSaved?: () => void;
}) {
  const isNew = !place;
  const router = useRouter();
  const upsert = upsertPlace.bind(null, bnbId);
  const [state, formAction, pending] = useActionState(upsert, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok) return;
    // Aggiorna la lista (i posti sono un prop dal server): il nuovo/modificato
    // appare subito senza ricaricare la pagina a mano.
    router.refresh();
    if (isNew) {
      formRef.current?.reset();
      onSaved?.();
    }
  }, [state, isNew, router, onSaved]);

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-4">
        {place && <input type="hidden" name="place_id" value={place.id} />}
        {/* L'ordine dei posti esistenti si cambia con le frecce nella riga
            (movePlace): il form non lo invia più. Il nuovo posto invece porta
            il sort_order del fondo lista, così finisce in coda. */}
        {isNew && (
          <input type="hidden" name="sort_order" defaultValue={defaultSortOrder ?? 0} />
        )}

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
          <FieldRow label="Immagine" htmlFor={`img-${place?.id ?? "new"}`}>
            <ImageUploadField
              bnbId={bnbId}
              id={`img-${place?.id ?? "new"}`}
              name="image_url"
              slot="posto"
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
    </>
  );
}

function DeletePlaceForm({ bnbId, place }: { bnbId: string; place: Place }) {
  const router = useRouter();
  const del = deletePlace.bind(null, bnbId);
  const [state, formAction, pending] = useActionState(del, undefined);
  const name = place.name.it ?? place.name.en;

  // Dopo l'eliminazione, ricarica la lista così la riga sparisce subito.
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

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

/**
 * Riga compatta di un posto: mostra categoria, nome e distanza a colpo
 * d'occhio; cliccando si apre a fisarmonica il form di modifica completo.
 * Le frecce su/giù riordinano il posto (movePlace) senza aprirlo.
 */
function PlaceRow({
  bnbId,
  place,
  isFirst,
  isLast,
}: {
  bnbId: string;
  place: Place;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [moving, startMove] = useTransition();
  const name = place.name.it ?? place.name.en;

  const move = (direction: "up" | "down") => {
    startMove(async () => {
      await movePlace(bnbId, place.id, direction);
      router.refresh();
    });
  };

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex items-center gap-1 p-2 pl-3.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 py-1.5 text-left"
        >
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-terracotta">
            {categoryLabel(place.category)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{name}</span>
            {place.walkingDistance && (
              <span className="block text-xs text-muted-foreground">
                {place.walkingDistance} a piedi
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {/* Frecce di riordino: impilate, disabilitate ai bordi della lista. */}
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => move("up")}
            disabled={isFirst || moving}
            aria-label={`Sposta "${name}" più in alto`}
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => move("down")}
            disabled={isLast || moving}
            aria-label={`Sposta "${name}" più in basso`}
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ArrowDown className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {open && (
        <CardContent className="border-t border-border p-5 pt-4">
          <PlaceFormBody bnbId={bnbId} place={place} />
        </CardContent>
      )}
    </Card>
  );
}

/** Oltre questo numero di posti la lista compatta si collassa dietro un "Vedi tutti". */
const PLACES_VISIBLE = 3;

export function PlacesEditor({
  bnbId,
  places,
}: {
  bnbId: string;
  places: Place[];
}) {
  const nextSort = places.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1;
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);

  // Lista compatta: di default si vedono solo le prime righe, il resto dietro
  // "Vedi tutti". Ogni riga si apre singolarmente per la modifica.
  const collapsible = places.length > PLACES_VISIBLE;
  const shownCount = collapsible && !expanded ? PLACES_VISIBLE : places.length;
  const hiddenCount = places.length - shownCount;

  return (
    <div className="space-y-3">
      {places.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          Nessun posto ancora. Aggiungine uno con il pulsante qui sotto.
        </p>
      )}

      {places.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Usa le frecce ↑↓ per cambiare l&apos;ordine in cui gli ospiti vedono i posti.
        </p>
      )}

      {places.slice(0, shownCount).map((place, i) => (
        <PlaceRow
          key={place.id}
          bnbId={bnbId}
          place={place}
          isFirst={i === 0}
          isLast={i === places.length - 1}
        />
      ))}

      {collapsible && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setExpanded((v) => !v)}
          className="h-11 w-full gap-2 rounded-2xl font-semibold"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
          {expanded ? "Mostra meno" : `Vedi tutti i posti (altri ${hiddenCount})`}
        </Button>
      )}

      {/* Aggiungi: il form vuoto appare solo dopo il "+", così la sezione
          resta compatta finché non serve davvero. */}
      {adding ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Nuovo posto
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAdding(false)}
                className="gap-1.5 rounded-lg text-muted-foreground"
              >
                <X className="size-4" aria-hidden />
                Annulla
              </Button>
            </div>
            <PlaceFormBody
              bnbId={bnbId}
              defaultSortOrder={nextSort}
              onSaved={() => setAdding(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          onClick={() => setAdding(true)}
          className="h-12 w-full gap-2 rounded-2xl border border-dashed border-terracotta/50 bg-transparent font-semibold text-terracotta hover:bg-terracotta/10 hover:text-terracotta"
        >
          <Plus className="size-5" aria-hidden />
          Aggiungi un posto
        </Button>
      )}
    </div>
  );
}
