"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitGuestFeedback } from "@/app/[bnbId]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UiStrings } from "@/lib/i18n";

interface ReviewModuleProps {
  /** Slug della struttura: il feedback finisce su guest_feedback con questa FK. */
  bnbId: string;
  t: UiStrings["review"];
}

// Placeholder: da sostituire con il link Google Reviews reale della struttura.
const GOOGLE_REVIEWS_URL =
  "https://search.google.com/local/writereview?placeid=PLACEHOLDER";

export function ReviewModule({ bnbId, t }: ReviewModuleProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSelect = (value: number) => {
    setRating(value);
    if (value >= 4) {
      // Voto alto → manda alle recensioni pubbliche.
      setShowForm(false);
      window.open(GOOGLE_REVIEWS_URL, "_blank", "noopener,noreferrer");
    } else {
      // Voto basso → feedback privato interno, non pubblico.
      setShowForm(true);
    }
  };

  // Salva davvero il feedback (server action → guest_feedback su Supabase).
  // Il form si svuota SOLO se l'invio riesce: in caso di errore l'ospite non
  // perde quello che ha scritto e può riprovare.
  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitGuestFeedback({
        bnbId,
        rating,
        message: feedback,
      });
      if (!result.ok) {
        toast.error(t.error);
        return;
      }
      setShowForm(false);
      setFeedback("");
      setRating(0);
      setHover(0);
      toast.success(t.thanks);
    });
  };

  const active = hover || rating;

  return (
    <Card className="py-0">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold">{t.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.prompt}</p>

        <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              onMouseEnter={() => setHover(value)}
              aria-label={t.starAria(value)}
              aria-pressed={rating === value}
              className="grid size-11 place-items-center rounded-xl transition-transform active:scale-90"
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  value <= active
                    ? "fill-ochre text-ochre"
                    : "fill-transparent text-muted-foreground/40",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>

        {showForm && (
          <div className="mt-4 space-y-3">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t.placeholder}
              rows={3}
              className="w-full resize-none rounded-2xl border border-input bg-background p-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              onClick={handleSubmit}
              disabled={feedback.trim().length === 0 || pending}
              className="h-12 w-full bg-terracotta text-base font-semibold text-primary-foreground hover:bg-terracotta-strong"
            >
              {pending ? "…" : t.submit}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
