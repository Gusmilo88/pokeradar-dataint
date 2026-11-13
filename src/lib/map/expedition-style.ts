import type { Map as MapLibreMap } from "maplibre-gl";
import { EXPEDITION_ZONES } from "@/lib/expedition/argentina";
import { expeditionAccents } from "@/lib/expedition/accents";
import { ARGENTINA_LAND } from "@/lib/map/argentina-land";

const QUIET_COUNTRY_LABELS = [
  "place_country_other",
  "place_country_minor",
  "place_country_major",
] as const;

/**
 * El canvas aplica contrast(1.16) y brightness(1.2).
 * Este valor es el que ese filtro muestra como #6ec4ea.
 */
const ARGENTINA_OUTLINE = "#619eba";
const OUTLINE_BEFORE = "place_other";

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

function outlinePaint(map: MapLibreMap): void {
  map.setPaintProperty("argentina-outline", "line-color", ARGENTINA_OUTLINE);
  map.setPaintProperty("argentina-outline", "line-opacity", 1);
  map.setPaintProperty("argentina-outline", "line-width", [
    "interpolate",
    ["linear"],
    ["zoom"],
    3,
    2.8,
    8,
    4.2,
    12,
    5,
  ]);
}

/** La frontera de OpenFreeMap queda debajo. Así el celeste es el trazo que se ve. */
function placeOutline(map: MapLibreMap): void {
  const before = map.getLayer(OUTLINE_BEFORE) ? OUTLINE_BEFORE : undefined;
  if (!map.getLayer("argentina-outline")) {
    map.addLayer(
      {
        id: "argentina-outline",
        type: "line",
        source: "argentina-land",
        paint: {
          "line-color": ARGENTINA_OUTLINE,
          "line-opacity": 1,
          "line-width": 2.8,
        },
      },
      before,
    );
  } else if (before) {
    map.moveLayer("argentina-outline", before);
  }
  outlinePaint(map);
}

function labelMalvinas(map: MapLibreMap, id: string): void {
  if (!map.getLayer(id)) {
    return;
  }
  const current = map.getLayoutProperty(id, "text-field");
  if (JSON.stringify(current).includes("Islas Malvinas")) {
    return;
  }
  map.setLayoutProperty(id, "text-field", [
    "case",
    ["==", ["coalesce", ["get", "name:es"], ""], "Islas Malvinas"],
    ["get", "name:es"],
    [
      "any",
      ["==", ["coalesce", ["get", "name_en"], ""], "Falkland Islands"],
      ["==", ["coalesce", ["get", "name:en"], ""], "Falkland Islands"],
      ["==", ["coalesce", ["get", "name"], ""], "Falkland Islands"],
    ],
    "Islas Malvinas",
    current ?? ["coalesce", ["get", "name_en"], ["get", "name"]],
  ] as never);
}

/**
 * El relleno queda debajo de ríos y calles. El contorno queda encima de la frontera del estilo y debajo de las etiquetas.
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
  placeOutline(map);

  const countryOpacity = ["interpolate", ["linear"], ["zoom"], 3, 0.38, 6, 0.82];
  for (const id of QUIET_COUNTRY_LABELS) {
    soften(map, id, countryOpacity);
    labelMalvinas(map, id);
  }
  soften(map, "place_state", ["interpolate", ["linear"], ["zoom"], 3, 0.28, 6.5, 0.85]);
}
