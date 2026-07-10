/**
 * Meteo attuale di Roma da Open-Meteo (API pubblica, gratuita, senza chiave e
 * con CORS abilitato → si chiama dal browser dell'ospite senza toccare la
 * staticità delle pagine guest). Le strutture sono tutte a Roma (vedi
 * CLAUDE.md), quindi le coordinate sono fisse; quando servirà il meteo
 * per-struttura basterà passare lat/lon dal DB.
 */

/** Famiglie di condizioni meteo (per icona + etichetta localizzata). */
export type WeatherKind =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

/** Centro di Roma. */
const ROME = { latitude: 41.8933, longitude: 12.4829 } as const;

/** Codici meteo WMO (quelli di Open-Meteo) → famiglia di condizione. */
export function weatherKindFromCode(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

export interface CurrentWeather {
  /** Temperatura in °C, arrotondata. */
  temp: number;
  kind: WeatherKind;
}

/**
 * Scarica il meteo attuale di Roma. Lancia in caso di rete/HTTP/payload non
 * validi: chi chiama gestisce il fallback (il widget mostra un placeholder).
 */
export async function fetchRomeWeather(signal?: AbortSignal): Promise<CurrentWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${ROME.latitude}` +
    `&longitude=${ROME.longitude}&current=temperature_2m,weather_code&timezone=Europe%2FRome`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`meteo HTTP ${res.status}`);

  const data = (await res.json()) as {
    current?: { temperature_2m?: unknown; weather_code?: unknown };
  };
  const temp = data.current?.temperature_2m;
  const code = data.current?.weather_code;
  if (typeof temp !== "number" || typeof code !== "number") {
    throw new Error("meteo: payload inatteso");
  }

  return { temp: Math.round(temp), kind: weatherKindFromCode(code) };
}
