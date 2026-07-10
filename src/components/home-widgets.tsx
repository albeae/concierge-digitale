"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { UiStrings } from "@/lib/i18n";
import { fetchRomeWeather, type CurrentWeather, type WeatherKind } from "@/lib/weather";

interface HomeWidgetsProps {
  t: UiStrings["widgets"];
}

/** Icona per ogni famiglia di condizione meteo. */
const WEATHER_ICONS: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
};

/**
 * Due widget affiancati: meteo attuale di Roma (Open-Meteo, `lib/weather.ts`)
 * e ora locale (orologio reale). Entrambi lato client; se il meteo non è
 * disponibile mostra un placeholder discreto senza rompere il layout.
 */
export function HomeWidgets({ t }: HomeWidgetsProps) {
  const [time, setTime] = useState<string | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

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

  useEffect(() => {
    const controller = new AbortController();
    fetchRomeWeather(controller.signal)
      .then(setWeather)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("[meteo]", err.message);
        }
      });
    return () => controller.abort();
  }, []);

  const WeatherIcon = weather ? WEATHER_ICONS[weather.kind] : Sun;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="py-0">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary">
            <WeatherIcon className="size-6 text-ochre" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.weather} · Roma
            </p>
            <p className="text-xl font-semibold leading-tight">
              {weather ? `${weather.temp}°` : "—°"}
            </p>
            <p className="min-h-4 truncate text-xs text-muted-foreground">
              {weather ? t.weatherConditions[weather.kind] : ""}
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
