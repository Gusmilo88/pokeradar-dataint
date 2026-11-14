import type { Map as MapLibreMap } from "maplibre-gl";
import { EXPEDITION_ZONES } from "@/lib/expedition/argentina";
import { expeditionAccents } from "@/lib/expedition/accents";
import { ATLANTIC_LABELS } from "@/lib/map/atlantic-hit";
import { ARGENTINA_LAND } from "@/lib/map/argentina-land";
import atlanticIslands from "@/lib/map/atlantic-islands.json";

const QUIET_COUNTRY_LABELS = [
  "place_country_other",
  "place_country_minor",
  "place_country_major",
] as const;

/**
 * El canvas aplica contrast(1.16) y brightness(1.2).
 * Este valor es el que ese filtro muestra como #6ec4ea.
 */
const ARGENTINA_FILL = "#7eb6d6";
const ARGENTINA_OUTLINE = "#3e7492";
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

/**
 * El filtro del canvas aplasta los negros. Estos tonos salen, ya filtrados,
 * como océano azul oscuro y tierra carbón. Desde el zoom 7 vuelven al estilo.
 */
const NIGHT_OCEAN = "#1c4564";
const NIGHT_LAND = "#2c2824";
const NIGHT_WOOD = "#1a2620";

function paintByZoom(map: MapLibreMap, id: string, property: string, near: string, far: string): void {
  if (!map.getLayer(id)) {
    return;
  }
  map.setPaintProperty(id, property as "fill-color", [
    "interpolate",
    ["linear"],
    ["zoom"],
    0,
    near,
    6,
    near,
    10,
    far,
  ] as never);
}

function paintNightEarth(map: MapLibreMap): void {
  paintByZoom(map, "background", "background-color", NIGHT_LAND, "rgb(12, 12, 12)");
  paintByZoom(map, "water", "fill-color", NIGHT_OCEAN, "rgb(27, 27, 29)");
  paintByZoom(map, "landcover_wood", "fill-color", NIGHT_WOOD, "rgb(32, 32, 32)");
  paintByZoom(map, "landuse_park", "fill-color", NIGHT_WOOD, "rgb(32, 32, 32)");
  paintByZoom(map, "landcover_glacier", "fill-color", "#1a2834", "hsl(0, 1%, 2%)");
  paintByZoom(map, "landcover_ice_shelf", "fill-color", "#1a2834", "rgb(12, 12, 12)");
}

function outlinePaint(map: MapLibreMap, id: string): void {
  map.setPaintProperty(id, "line-color", ARGENTINA_OUTLINE);
  map.setPaintProperty(id, "line-opacity", 1);
  map.setPaintProperty(id, "line-width", [
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
  outlinePaint(map, "argentina-outline");
}

const HIDDEN_ISLAND_NAMES = [
  "falkland islands",
  "falkland is.",
  "islas malvinas",
  "south georgia and the south sandwich islands",
  "south georgia and south sandwich islands",
  "s. geo. and the is.",
  "south georgia",
  "south sandwich islands",
  "islas georgias del sur",
  "islas georgias del sur y sandwich del sur",
  "islas sandwich del sur",
];

function hideRemoteIslandNames(map: MapLibreMap): void {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
    if (layer.type !== "symbol" || (sourceLayer !== "place" && sourceLayer !== "water_name")) {
      continue;
    }
    const current = map.getFilter(layer.id);
    if (JSON.stringify(current).includes("falkland islands")) {
      continue;
    }
    const drop = [
      "!",
      [
        "in",
        [
          "downcase",
          [
            "to-string",
            ["coalesce", ["get", "name_en"], ["get", "name:en"], ["get", "name:es"], ["get", "name"], ""],
          ],
        ],
        ["literal", HIDDEN_ISLAND_NAMES],
      ],
    ];
    map.setFilter(layer.id, (current ? ["all", current, drop] : drop) as never);
  }
}

function placeIslands(map: MapLibreMap): void {
  const before = map.getLayer(OUTLINE_BEFORE) ? OUTLINE_BEFORE : undefined;
  if (!map.getSource("atlantic-islands")) {
    map.addSource("atlantic-islands", {
      type: "geojson",
      data: atlanticIslands as never,
    });
  }
  if (!map.getLayer("atlantic-fill")) {
    map.addLayer(
      {
        id: "atlantic-fill",
        type: "fill",
        source: "atlantic-islands",
        paint: {
          "fill-color": ARGENTINA_FILL,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 7, 0.18, 11, 0.06, 13, 0.03],
        },
      },
      before,
    );
  }
  if (!map.getLayer("atlantic-outline")) {
    map.addLayer(
      {
        id: "atlantic-outline",
        type: "line",
        source: "atlantic-islands",
        paint: {
          "line-color": ARGENTINA_OUTLINE,
          "line-opacity": 1,
          "line-width": 2.8,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
      },
      before,
    );
  } else if (before) {
    map.moveLayer("atlantic-outline", before);
  }
  outlinePaint(map, "atlantic-outline");

  if (!map.getSource("atlantic-labels")) {
    map.addSource("atlantic-labels", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: ATLANTIC_LABELS.map((label) => ({
          type: "Feature" as const,
          properties: { name: label.name, group: label.group },
          geometry: { type: "Point" as const, coordinates: [label.longitude, label.latitude] },
        })),
      },
    });
  }
  if (!map.getLayer("atlantic-label")) {
    map.addLayer({
      id: "atlantic-label",
      type: "symbol",
      source: "atlantic-labels",
      minzoom: 4.8,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 5, 11, 8, 15],
        "text-letter-spacing": 0.08,
        "text-max-width": 14,
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-padding": 6,
      },
      paint: {
        "text-color": "#d7e7f2",
        "text-halo-color": "#07141c",
        "text-halo-width": 1.25,
      },
    });
  }
}

/**
 * El relleno queda debajo de ríos y calles. El contorno queda encima de la frontera del estilo y debajo de las etiquetas.
 * Los acentos son manchas de expedición, no polígonos de bioma.
 */
export function applyExpeditionStyle(map: MapLibreMap): void {
  paintNightEarth(map);
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
          "fill-color": ARGENTINA_FILL,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.32, 7, 0.16, 11, 0.06, 13, 0.03],
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
  placeIslands(map);
  hideRemoteIslandNames(map);

  const countryOpacity = ["interpolate", ["linear"], ["zoom"], 0, 0.78, 2.2, 0.7, 3, 0.38, 6, 0.82];
  for (const id of QUIET_COUNTRY_LABELS) {
    soften(map, id, countryOpacity);
  }
  soften(map, "place_state", ["interpolate", ["linear"], ["zoom"], 3, 0.28, 6.5, 0.85]);
}
