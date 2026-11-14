"use client";

import { BIOME_NOTE } from "@/lib/expedition/biomes";
import { HABITAT_LABEL, type ExpeditionZone } from "@/lib/expedition/argentina";
import { WEATHER_FAVORED, moodFromSnapshot, weatherLabel, type WeatherMood } from "@/lib/expedition/weather";
import type { ZoneWeather } from "@/components/expedition/use-region-weather";
import { typeLabel } from "@/lib/pokeapi/labels";

function favoredLine(mood: WeatherMood): string {
  if (mood === "neutral") {
    return "Sin ventaja de tipo.";
  }
  return WEATHER_FAVORED[mood].map((type) => typeLabel(type)).join(" y ");
}

export function RegionBrief({
  zone,
  weather,
  activeCount,
  onClose,
}: {
  zone: ExpeditionZone;
  weather: ZoneWeather | undefined;
  activeCount: number;
  onClose: () => void;
}) {
  const ready = weather?.status === "ready" ? weather.snapshot : null;
  const mood = ready ? moodFromSnapshot(ready) : null;

  return (
    <aside className="region-brief" aria-label={`Exploración de ${zone.name}`}>
      <p className="font-mono text-[10px] tracking-[0.16em] text-phosphor uppercase">{zone.code} · {HABITAT_LABEL[zone.habitat]}</p>
      <h2 className="text-lg font-semibold">{zone.name}</h2>
      <p className="mt-1 text-sm text-quiet">{BIOME_NOTE[zone.habitat]}</p>
      <p className="mt-2 text-sm">
        {weather?.status === "ready" && ready && mood
          ? `${weatherLabel(ready)}, ${ready.temperatureC.toFixed(0)} °C. Favorece ${favoredLine(mood)}.`
          : weather?.status === "pending"
            ? "Leyendo el clima…"
            : "Clima no disponible."}
      </p>
      <p className="mt-1 text-sm text-quiet">{activeCount} señales en esta zona.</p>
      <button type="button" className="action-button mt-2" onClick={onClose}>Cerrar</button>
    </aside>
  );
}
