"use client";

import { useState } from "react";
import { Compass } from "lucide-react";
import { PlaceCard } from "@/components/place-card";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";
import type { UiStrings } from "@/lib/i18n";
import type { Locale, Place, PlaceCategory } from "@/types";

interface ExploreTabProps {
  places: Place[];
  locale: Locale;
  t: UiStrings;
}

type Filter = PlaceCategory | "all";

const CATEGORIES: PlaceCategory[] = ["ristorante", "bar", "servizio"];

export function ExploreTab({ places, locale, t }: ExploreTabProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? places : places.filter((p) => p.category === filter);

  const chips: { value: Filter; label: string }[] = [
    { value: "all", label: t.places.filterAll },
    ...CATEGORIES.map((c) => ({ value: c, label: t.places.filters[c] })),
  ];

  return (
    <div className="space-y-4 pb-6">
      <SectionHeading icon={Compass}>{t.places.exploreTitle}</SectionHeading>

      <div
        role="group"
        aria-label={t.places.exploreTitle}
        className="flex flex-wrap gap-2"
      >
        {chips.map((chip) => {
          const active = chip.value === filter;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter(chip.value)}
              aria-pressed={active}
              className={cn(
                "h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-terracotta bg-terracotta text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              locale={locale}
              t={t.places}
            />
          ))}
        </div>
      ) : (
        <p className="px-1 py-8 text-center text-muted-foreground">
          {t.places.empty}
        </p>
      )}
    </div>
  );
}
