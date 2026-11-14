/**
 * El clima sale de una observación actual. Estos códigos WMO no inventan
 * temperatura ni milímetros: solo clasifican el weather_code ya medido.
 */

export interface WeatherSnapshot {
  weatherCode: number;
  temperatureC: number;
  precipitationMm: number;
  snowfallCm: number;
  isDay: boolean;
  observedAt: string;
}

export type WeatherMood = "rain" | "snow" | "sun" | "neutral";

export const WEATHER_FAVORED: Record<Exclude<WeatherMood, "neutral">, readonly string[]> = {
  rain: ["water", "electric"],
  snow: ["ice"],
  sun: ["fire"],
};

export function moodFromSnapshot(snapshot: WeatherSnapshot): WeatherMood {
  const code = snapshot.weatherCode;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return "snow";
  }
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99) ||
    snapshot.precipitationMm > 0
  ) {
    return "rain";
  }
  if (snapshot.isDay && (code === 0 || code === 1)) {
    return "sun";
  }
  return "neutral";
}

export function weatherLabel(snapshot: WeatherSnapshot): string {
  const mood = moodFromSnapshot(snapshot);
  if (mood === "snow") {
    return "Nieve";
  }
  if (mood === "rain") {
    return "Lluvia";
  }
  if (mood === "sun") {
    return "Sol";
  }
  if (snapshot.weatherCode === 0 || snapshot.weatherCode === 1) {
    return snapshot.isDay ? "Despejado" : "Noche despejada";
  }
  if (snapshot.weatherCode === 2 || snapshot.weatherCode === 3) {
    return "Nublado";
  }
  if (snapshot.weatherCode === 45 || snapshot.weatherCode === 48) {
    return "Niebla";
  }
  return "Condición sin clasificar";
}

/**
 * El conjunto activo cambia con el clima cuando la zona tiene tipos favorecidos.
 * Si falta el tipo de alguna especie, no se recorta el grupo.
 * Las que no salen hoy vuelven al día siguiente: el índice del día las rota.
 */
export function activeEncounterIds(
  ids: readonly string[],
  typeOf: (id: string) => readonly string[] | null,
  mood: WeatherMood,
  dayIndex: number,
): string[] {
  if (ids.length === 0 || mood === "neutral") {
    return [...ids];
  }
  const favoredTypes = WEATHER_FAVORED[mood];
  const favored: string[] = [];
  const others: string[] = [];
  for (const id of ids) {
    const types = typeOf(id);
    if (!types) {
      return [...ids];
    }
    if (types.some((type) => favoredTypes.includes(type))) {
      favored.push(id);
    } else {
      others.push(id);
    }
  }
  if (favored.length === 0) {
    return [...ids];
  }
  const kept = others.filter((_, index) => (index + dayIndex) % 2 === 0);
  const active = [...favored, ...kept];
  return active.length === 0 ? [...ids] : active;
}
