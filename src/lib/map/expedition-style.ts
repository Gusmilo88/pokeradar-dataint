import type { Map as MapLibreMap } from "maplibre-gl";
import { EXPEDITION_ZONES } from "@/lib/expedition/argentina";
import { expeditionAccents } from "@/lib/expedition/accents";
import { ARGENTINA_LAND } from "@/lib/map/argentina-land";

const QUIET_COUNTRY_LABELS = [
  "place_country_other",
  "place_country_minor",
  "place_country_major",
] as const;

function beforeRoads(map: MapLibreMap): string | undefined {
  if (map.getLayer("waterway")) {
    return "waterway";
  }
  console.warn("OpenFreeMap dark ya no tiene la capa waterway. El relleno de Argentina quedó arriba del estilo.");
  return undefined;
}

function soften(map: MapLibreMap, id: string, opacity: unknown): void {
  if (!map.getLayer(id)) {
    console.warn(`OpenFreeMap dark ya no tiene la capa ${id}. No se ajustó su opacidad.`);
    return;
  }
  map.setPaintProperty(id, "text-opacity", opacity as never);
}

/**
 * Argentina queda por encima de la cobertura del terreno y por debajo de ríos, calles y etiquetas.
 * Los acentos son manchas de expedición, no polígonos de bioma.
 */
export function applyExpeditionStyle(map: MapLibreMap): void {
  const before = beforeRoads(map);
  const accentColor: unknown[] = ["match", ["get", "zoneId"]];
  for (const zone of EXPEDITION_ZONES) {
    accentColor.push(zone.id, zone.accent);
  }
  accentColor.push("#6d645c");

  if (!map.getSource("argentina-land")) {
    map.addSource("argentina-land", {
      type: "geojson",
      data: ARGENTINA_LAND as never,
    });
  }
  if (!map.getSource("expedition-accents")) {
    map.addSource("expedition-accents", {
      type: "geojson",
      data: expeditionAccents(EXPEDITION_ZONES) as never,
    });
  }

  if (!map.getLayer("argentina-fill")) {
    map.addLayer(
      {
        id: "argentina-fill",
        type: "fill",
        source: "argentina-land",
        paint: {
          "fill-color": "#d9c7a4",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 7, 0.12, 11, 0.05],
        },
      },
      before,
    );
  }
  if (!map.getLayer("expedition-accent")) {
    map.addLayer(
      {
        id: "expedition-accent",
        type: "fill",
        source: "expedition-accents",
        paint: {
          "fill-color": accentColor as never,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.04, 6.5, 0.34, 10, 0.18, 13, 0.06],
        },
      },
      before,
    );
  }
  if (!map.getLayer("argentina-outline")) {
    map.addLayer(
      {
        id: "argentina-outline",
        type: "line",
        source: "argentina-land",
        paint: {
          "line-color": "#f4efe4",
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.8, 8, 1.15, 12, 0.6],
          "line-opacity": 0.92,
        },
      },
      before,
    );
  }

  const countryOpacity = ["interpolate", ["linear"], ["zoom"], 3, 0.38, 6, 0.82];
  for (const id of QUIET_COUNTRY_LABELS) {
    soften(map, id, countryOpacity);
  }
  soften(map, "place_state", ["interpolate", ["linear"], ["zoom"], 3, 0.28, 6.5, 0.85]);
}
