import Image from "next/image";
import { Footprints, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pick } from "@/lib/localize";
import type { UiStrings } from "@/lib/i18n";
import type { Locale, Place, PlaceCategory } from "@/types";

interface PlaceCardProps {
  place: Place;
  locale: Locale;
  t: UiStrings["places"];
}

/** Emoji di ripiego mostrata quando il posto non ha ancora una foto. */
const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  ristorante: "🍝",
  bar: "🍷",
  servizio: "🛎️",
};

export function PlaceCard({ place, locale, t }: PlaceCardProps) {
  const name = pick(place.name, locale);
  const description = pick(place.description, locale);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="relative flex h-32 items-center justify-center bg-secondary">
        {place.imageUrl ? (
          <Image
            src={place.imageUrl}
            alt={name}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        ) : (
          <span className="text-5xl opacity-80" aria-hidden>
            {CATEGORY_EMOJI[place.category]}
          </span>
        )}
        <Badge className="absolute left-3 top-3 bg-terracotta text-primary-foreground">
          {t.categoryLabel[place.category]}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">
            {name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
            <Footprints className="size-4" aria-hidden />
            {place.walkingDistance} {t.walk}
          </span>
        </div>

        <p className="mt-2 border-l-2 border-ochre pl-3 text-base italic leading-relaxed text-muted-foreground">
          {description}
        </p>

        <a
          href={place.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-4 h-12 w-full gap-2 rounded-2xl border-terracotta/50 bg-transparent text-base font-medium text-terracotta hover:bg-terracotta/10 hover:text-terracotta",
          )}
        >
          <MapPin className="size-5" aria-hidden />
          {t.openMaps}
        </a>
      </CardContent>
    </Card>
  );
}
