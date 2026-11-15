import type {
  ColorReliefLayerSpecification,
  ErrorEvent,
  ExpressionSpecification,
  HillshadeLayerSpecification,
  Map as MapLibreMap,
} from "maplibre-gl";

/**
 * Prototipo de superficie, solo con ?planetPreview=1 en desarrollo.
 * No cambia proyección, cámara, marcadores ni el estilo de la expedición.
 * El relieve es una lectura del DEM. No se extruye el terreno, así el globo
 * no desplaza los marcadores.
 */

export const PLANET_PREVIEW_PARAM = "planetPreview";

/** Terrain Tiles de AWS Open Data. Teselas Terrarium de 256 px, CC BY 4.0 (Mapzen). */
export const PLANET_DEM_TILES =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

export const PLANET_DEM_ENCODING = "terrarium" as const;

/** Por encima se estira la última tesela. Evita pedir el DEM calle por calle. */
export const PLANET_DEM_MAX_ZOOM = 11;

export const PLANET_DEM_TILE_SIZE = 256;

const PLANET_DEM_SOURCE = "planet-dem";
const RELIEF_ID = "planet-relief";
const SHADE_ID = "planet-hillshade";
const OCEAN_ID = "planet-ocean";

/**
 * ETOPO1 (batimetría y baja resolución), GMTED2010 y SRTM.
 * En zooms altos el mar de SRTM queda plano: no se inventa relieve.
 */
const PLANET_DEM_ATTRIBUTION =
  "Relieve: Terrain Tiles de AWS Open Data, © Mapzen (CC BY 4.0). SRTM, ETOPO1 y GMTED2010.";

const FAILURE_LIMIT = 12;

const RELIEF_OPACITY: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  0,
  0.7,
  3,
  0.64,
  6,
  0.46,
  9,
  0.26,
  13,
  0.12,
];

/**
 * Rampa de tierra. Desde el nivel del mar los tonos no cambian.
 * El mar de esta capa solo asoma donde el velo superior es translúcido.
 */
const RELIEF_COLOR: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["elevation"],
  -9000,
  "#0a3470",
  -5500,
  "#0c3e7a",
  -2500,
  "#104888",
  -400,
  "#14538c",
  -20,
  "#1c6288",
  0,
  "#1a2420",
  120,
  "#1e2822",
  600,
  "#262820",
  1400,
  "#302c26",
  2500,
  "#3a342c",
  3800,
  "#4a433a",
  5200,
  "#5c554c",
  6800,
  "#6e6860",
];

const SHADE_EXAGGERATION: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  0,
  0.14,
  2,
  0.22,
  4.2,
  0.58,
  7,
  0.4,
  11,
  0.18,
];

/**
 * Velo solo bajo el nivel del mar. El filtro del canvas aclara estos tonos
 * hacia el azul de referencia; en el origen van un poco más hondos para no salir cian.
 * En tierra la rampa es transparente, así el sombreado continental no cambia.
 */
const OCEAN_COLOR: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["elevation"],
  -9000,
  "#0a3470",
  -5500,
  "#0c3e7a",
  -2800,
  "#104888",
  -1200,
  "#14538c",
  -350,
  "#1c6896",
  -80,
  "#247898",
  -12,
  "#2c88a0",
  0,
  "rgba(0, 0, 0, 0)",
  9000,
  "rgba(0, 0, 0, 0)",
];

const OCEAN_VEIL: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  0,
  0.76,
  5,
  0.72,
  9,
  0.66,
];

/** Polígono de agua cuando el DEM no trae profundidad. No pinta tierra. */
const OCEAN_FILL: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  0,
  "#0e4a84",
  8,
  "#14538c",
  12,
  "#123e78",
];

/** Color que pinta la expedición. Se restaura si el prototipo se retira. */
const EXPEDITION_WATER: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  0,
  "#1c4564",
  6,
  "#1c4564",
  10,
  "rgb(27, 27, 29)",
];

/** Deja ver la batimetría lejos y vuelve al océano plano del estilo al acercar. */
const OCEAN_OPACITY: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  0,
  0.42,
  4,
  0.38,
  7,
  0.58,
  10,
  0.9,
  12,
  1,
];

const pending = new WeakSet<MapLibreMap>();
const retired = new WeakSet<MapLibreMap>();
const listeners = new WeakMap<MapLibreMap, (event: ErrorEvent) => void>();

export function planetPreviewEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return new URLSearchParams(window.location.search).get(PLANET_PREVIEW_PARAM) === "1";
  } catch {
    return false;
  }
}

function probeUrl(): string {
  return PLANET_DEM_TILES.replace("{z}", "0").replace("{x}", "0").replace("{y}", "0");
}

function shadeAnchor(map: MapLibreMap): string | undefined {
  if (map.getLayer("argentina-fill")) {
    return "argentina-fill";
  }
  if (map.getLayer("waterway")) {
    return "waterway";
  }
  return undefined;
}

function paintOceanFill(map: MapLibreMap): void {
  if (!map.getLayer("water")) {
    return;
  }
  map.setPaintProperty("water", "fill-color", OCEAN_FILL);
  map.setPaintProperty("water", "fill-opacity", OCEAN_OPACITY);
}

function restoreOcean(map: MapLibreMap): void {
  if (!map.getLayer("water")) {
    return;
  }
  map.setPaintProperty("water", "fill-color", EXPEDITION_WATER);
  map.setPaintProperty("water", "fill-opacity", 1);
}

function removePlanetPreview(map: MapLibreMap): void {
  const listener = listeners.get(map);
  if (listener) {
    map.off("error", listener);
    listeners.delete(map);
  }
  if (map.getLayer(OCEAN_ID)) {
    map.removeLayer(OCEAN_ID);
  }
  if (map.getLayer(SHADE_ID)) {
    map.removeLayer(SHADE_ID);
  }
  if (map.getLayer(RELIEF_ID)) {
    map.removeLayer(RELIEF_ID);
  }
  if (map.getSource(PLANET_DEM_SOURCE)) {
    map.removeSource(PLANET_DEM_SOURCE);
  }
  restoreOcean(map);
}

function watchFailures(map: MapLibreMap): void {
  if (listeners.has(map)) {
    return;
  }
  let failures = 0;
  const onError = (event: ErrorEvent) => {
    const sourceId = "sourceId" in event && typeof event.sourceId === "string" ? event.sourceId : "";
    const message = event.error.message.toLowerCase();
    const fromDem = sourceId === PLANET_DEM_SOURCE || message.includes("terrarium");
    if (!fromDem || message.includes("abort") || message.includes("cancel")) {
      return;
    }
    failures += 1;
    if (failures === 1) {
      console.warn("Una tesela de relieve falló. La superficie original sigue debajo.", event.error);
    }
    if (failures < FAILURE_LIMIT || retired.has(map)) {
      return;
    }
    retired.add(map);
    console.warn("El relieve se retiró tras fallos repetidos. Quedó la superficie original.");
    try {
      removePlanetPreview(map);
    } catch (error) {
      console.warn("No se pudo retirar el relieve.", error);
    }
  };
  listeners.set(map, onError);
  map.on("error", onError);
}

function addPlanetLayers(map: MapLibreMap): void {
  if (!map.getLayer("water")) {
    console.warn("El estilo no tiene la capa water. No se aplicó el prototipo de superficie.");
    return;
  }
  if (!map.getSource(PLANET_DEM_SOURCE)) {
    map.addSource(PLANET_DEM_SOURCE, {
      type: "raster-dem",
      tiles: [PLANET_DEM_TILES],
      encoding: PLANET_DEM_ENCODING,
      tileSize: PLANET_DEM_TILE_SIZE,
      minzoom: 0,
      maxzoom: PLANET_DEM_MAX_ZOOM,
      attribution: PLANET_DEM_ATTRIBUTION,
    });
  }

  const relief: ColorReliefLayerSpecification = {
    id: RELIEF_ID,
    type: "color-relief",
    source: PLANET_DEM_SOURCE,
    paint: {
      "color-relief-opacity": RELIEF_OPACITY,
      "color-relief-color": RELIEF_COLOR,
      resampling: "linear",
    },
  };
  if (!map.getLayer(RELIEF_ID)) {
    map.addLayer(relief, "water");
  }

  const shade: HillshadeLayerSpecification = {
    id: SHADE_ID,
    type: "hillshade",
    source: PLANET_DEM_SOURCE,
    paint: {
      "hillshade-method": "multidirectional",
      "hillshade-exaggeration": SHADE_EXAGGERATION,
      "hillshade-illumination-direction": 315,
      "hillshade-illumination-altitude": 50,
      "hillshade-shadow-color": "#03060c",
      "hillshade-highlight-color": "#5e6d66",
      "hillshade-accent-color": "#3d4a44",
    },
  };
  if (!map.getLayer(SHADE_ID)) {
    map.addLayer(shade, shadeAnchor(map));
  }

  const ocean: ColorReliefLayerSpecification = {
    id: OCEAN_ID,
    type: "color-relief",
    source: PLANET_DEM_SOURCE,
    paint: {
      "color-relief-opacity": OCEAN_VEIL,
      "color-relief-color": OCEAN_COLOR,
      resampling: "linear",
    },
  };
  if (!map.getLayer(OCEAN_ID)) {
    map.addLayer(ocean, shadeAnchor(map));
  }
  paintOceanFill(map);
  watchFailures(map);
}

async function mountPlanetPreview(map: MapLibreMap): Promise<void> {
  try {
    const response = await fetch(probeUrl(), { method: "GET", mode: "cors" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    await response.body?.cancel();
  } catch (error) {
    console.warn("El relieve del prototipo no respondió. La superficie original sigue activa.", error);
    return;
  }

  try {
    if (!map.getStyle() || retired.has(map) || map.getLayer(OCEAN_ID)) {
      return;
    }
    addPlanetLayers(map);
  } catch (error) {
    console.warn("MapLibre rechazó el relieve. Se vuelve a la superficie original.", error);
    try {
      removePlanetPreview(map);
    } catch {
      // El mapa ya se destruyó.
    }
  }
}

export function applyPlanetPreview(map: MapLibreMap): void {
  if (!planetPreviewEnabled() || retired.has(map)) {
    return;
  }
  if (map.getLayer(OCEAN_ID)) {
    paintOceanFill(map);
    return;
  }
  if (pending.has(map)) {
    return;
  }
  pending.add(map);
  void mountPlanetPreview(map).finally(() => {
    pending.delete(map);
  });
}
