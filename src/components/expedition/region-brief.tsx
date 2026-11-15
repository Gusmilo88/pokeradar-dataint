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

function observedClock(observedAt: string): string {
  const match = /T(\d{2}:\d{2})/.exec(observedAt);
  return match?.[1] ?? observedAt;
}

export function RegionBrief({
  zone,
  weather,
  activeCount,
  onRetry,
  onClose,
}: {
  zone: ExpeditionZone;
  weather: ZoneWeather | undefined;
  activeCount: number;
  onRetry: () => void;
  onClose: () => void;
}) {
  const ready = weather?.status === "ready" ? weather : null;
  const mood = ready ? moodFromSnapshot(ready.snapshot) : null;
  const failed = weather?.status === "unavailable" ? weather.message : null;

  return (
    <aside className="region-brief" aria-label={`Exploración de ${zone.name}`}>
      <p className="font-mono text-[10px] tracking-[0.16em] text-phosphor uppercase">{zone.code} · {HABITAT_LABEL[zone.habitat]}</p>
      <h2 className="text-lg font-semibold">{zone.name}</h2>
      <p className="mt-1 text-sm text-quiet">{BIOME_NOTE[zone.habitat]}</p>
      <p className="mt-2 text-sm" role={failed ? "alert" : "status"}>
        {ready && mood
          ? `${ready.stale ? "Dato guardado, puede estar desactualizado. " : ""}${weatherLabel(ready.snapshot)}, ${ready.snapshot.temperatureC.toFixed(0)} °C. Observado a las ${observedClock(ready.snapshot.observedAt)}. Favorece ${favoredLine(mood).replace(/\.$/, "")}.`
          : failed
            ? failed
            : "Leyendo el clima…"}
      </p>
      {failed ? (
        <button type="button" className="action-button mt-2" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
      <p className="mt-1 text-sm text-quiet">{activeCount} señales en esta zona.</p>
      <button type="button" className="action-button mt-2" onClick={onClose}>Cerrar</button>
    </aside>
  );
}
