"use client";

import { useEffect, useState } from "react";
import { Clock, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { UiStrings } from "@/lib/i18n";

interface HomeWidgetsProps {
  t: UiStrings["widgets"];
}

/**
 * Due widget affiancati: meteo (dati finti, da collegare a un'API) e ora
 * locale di Roma (orologio reale, aggiornato lato client).
 */
export function HomeWidgets({ t }: HomeWidgetsProps) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Rome",
        }).format(new Date()),
      );
    };
    update();
    const id = window.setInterval(update, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="py-0">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary">
            <Sun className="size-6 text-ochre" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.weather} · Roma
            </p>
            <p className="text-xl font-semibold leading-tight">27°</p>
            <p className="truncate text-xs text-muted-foreground">
              {t.weatherCondition}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary">
            <Clock className="size-6 text-terracotta" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.time} · Roma
            </p>
            <p className="font-mono text-xl font-semibold leading-tight tabular-nums">
              {time ?? "--:--"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
