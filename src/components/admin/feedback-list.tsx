"use client";

import { useActionState, useState } from "react";
import { ChevronDown, Star, Trash2 } from "lucide-react";
import { deleteFeedback } from "@/app/admin/[bnbId]/actions";
import { StatusMessage } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GuestFeedback } from "@/types";

/** Data leggibile in italiano, es. "8 luglio 2026, 14:30". */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Le 5 stelle della scala mostrata all'ospite, con `rating` piene. */
function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} stelle su 5`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            "size-4",
            value <= rating
              ? "fill-ochre text-ochre"
              : "fill-transparent text-muted-foreground/40",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function FeedbackCard({ bnbId, item }: { bnbId: string; item: GuestFeedback }) {
  const del = deleteFeedback.bind(null, bnbId);
  const [state, formAction, pending] = useActionState(del, undefined);

  return (
    <Card className="py-0">
      <CardContent className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-3">
          <RatingStars rating={item.rating} />
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate(item.createdAt)}
          </span>
        </div>

        <p className="min-h-5 whitespace-pre-wrap text-sm leading-relaxed">
          {item.message}
        </p>

        <form
          action={formAction}
          onSubmit={(e) => {
            if (!window.confirm("Eliminare questo feedback? L'azione è definitiva.")) {
              e.preventDefault();
            }
          }}
          className="flex items-center gap-3 border-t border-border pt-2.5"
        >
          <input type="hidden" name="feedback_id" value={item.id} />
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
      </CardContent>
    </Card>
  );
}

/** Oltre questo numero di feedback la lista si collassa dietro un "Vedi tutti". */
const FEEDBACK_VISIBLE = 3;

/**
 * Lista dei feedback privati (voti 1-3) lasciati dagli ospiti dalla pagina
 * guest. Solo lettura + eliminazione: l'ospite scrive, il titolare gestisce.
 */
export function FeedbackList({
  bnbId,
  feedback,
}: {
  bnbId: string;
  feedback: GuestFeedback[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (feedback.length === 0) {
    return (
      <Card className="py-0">
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Nessun feedback ricevuto finora. Qui compariranno i messaggi
            privati degli ospiti che lasciano una valutazione da 1 a 3 stelle
            (i voti più alti vengono invitati a recensire su Google).
          </p>
        </CardContent>
      </Card>
    );
  }

  // I feedback arrivano dal più recente: se sono tanti se ne mostrano i primi
  // pochi, gli altri dietro "Vedi tutti".
  const collapsible = feedback.length > FEEDBACK_VISIBLE;
  const visible =
    collapsible && !expanded ? feedback.slice(0, FEEDBACK_VISIBLE) : feedback;
  const hiddenCount = feedback.length - visible.length;

  return (
    <div className="space-y-3">
      {visible.map((item) => (
        <FeedbackCard key={item.id} bnbId={bnbId} item={item} />
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
          {expanded
            ? "Mostra meno"
            : `Vedi tutti i feedback (altri ${hiddenCount})`}
        </Button>
      )}
    </div>
  );
}
