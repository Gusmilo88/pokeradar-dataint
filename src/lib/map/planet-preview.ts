import type {
  ColorReliefLayerSpecification,
  ErrorEvent,
  ExpressionSpecification,
  HillshadeLayerSpecification,
  Map as MapLibreMap,
  SkySpecification,
} from "maplibre-gl";
import { PLANET_SKY } from "@/lib/map/globe";
import { flattenPolarDem, isPolarDemTile } from "@/lib/map/planet-poles";

/**
 * Superficie definitiva del globo (océano, batimetría, relieve y atmósfera).
 * Se aplica por defecto en el navegador, también en producción.
 * No cambia proyección, cámara, marcadores ni el estilo de la expedición.
 * El relieve es una lectura del DEM. No se extruye el terreno, así el globo
 * no desplaza los marcadores.
 */

/** Conservado por compatibilidad con scripts; ya no activa la superficie. */
export const PLANET_PREVIEW_PARAM = "planetPreview";

/** Terrain Tiles de AWS Open Data. Teselas Terrarium de 256 px, CC BY 4.0 (Mapzen). */
export const PLANET_DEM_TILES =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/**
 * La tesela pasa por el protocolo para aplanar solo el borde polar.
 * El interior y el resto de los zooms siguen siendo el PNG de AWS.
 */
const PLANET_DEM_URL = "planetdem://dem/{z}/{x}/{y}.png";

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

/**
 * Atmósfera del planeta definitivo. Más ancha y más pálida que el cielo base,
 * y casi sin niebla sobre el suelo para no apagar Argentina.
 */
const PREVIEW_SKY: SkySpecification = {
  "sky-color": "rgba(2, 6, 14, 0)",
  "horizon-color": "#d4f1fa",
  "sky-horizon-blend": 0.88,
  "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.95, 2, 0.72, 4.5, 0.22, 7.5, 0],
  "horizon-fog-blend": 0.04,
  "fog-color": "#b7dbe8",
};

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
  0,
  2.4,
  0,
  3.4,
  0.35,
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
  // Por debajo de 1.7 el abanico del polo ocupa el centro. El velo ahí
  // dibuja un círculo. El agua de abajo ya es continua.
  0,
  0,
  1.7,
  0,
  2.15,
  0.9,
  5,
  0.84,
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

/**
 * Opacidad constante. En 6.18 un valor que no es constante pasa al pase
 * translúcido, con profundidad de solo lectura: los triángulos del polo
 * se superponen y el casquete sale más oscuro que el océano de al lado.
 * Con 1 el pase es opaco, la profundidad descarta la segunda pasada y el
 * casquete queda del mismo azul. La batimetría la pinta el velo de arriba.
 */
const OCEAN_FILL_OPACITY = 1;

const pending = new WeakSet<MapLibreMap>();
const retired = new WeakSet<MapLibreMap>();
const listeners = new WeakMap<MapLibreMap, (event: ErrorEvent) => void>();
const demLoads = new Map<string, Promise<ArrayBuffer>>();
let demProtocolReady = false;

function loadDemTile(z: string, x: string, y: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const key = `${z}/${x}/${y}`;
  const cached = demLoads.get(key);
  if (cached) {
    return cached;
  }
  const url = PLANET_DEM_TILES.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  const job = fetch(url, { signal, mode: "cors" }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`terrarium HTTP ${response.status}`);
    }
    return response.arrayBuffer();
  });
  demLoads.set(key, job);
  void job.finally(() => {
    setTimeout(() => demLoads.delete(key), 20000);
  }).catch(() => undefined);
  return job;
}

/** Solo corre en el navegador, antes de agregar la fuente. */
async function registerDemProtocol(): Promise<void> {
  if (demProtocolReady || typeof document === "undefined") {
    return;
  }
  const { addProtocol } = await import("maplibre-gl");
  if (demProtocolReady) {
    return;
  }
  demProtocolReady = true;
  addProtocol("planetdem", async (params, abortController) => {
    const match = /^planetdem:\/\/dem\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(params.url);
    if (!match) {
      throw new Error("terrarium: tesela no reconocida");
    }
    const z = match[1];
    const x = match[2];
    const y = match[3];
    if (z === undefined || x === undefined || y === undefined) {
      throw new Error("terrarium: tesela no reconocida");
    }
    const zoom = Number(z);
    const row = Number(y);
    const original = await loadDemTile(z, x, y, abortController.signal);
    if (!isPolarDemTile(zoom, row)) {
      return { data: original };
    }
    try {
      const blob = new Blob([original], { type: "image/png" });
      const bitmap = await createImageBitmap(blob, {
        colorSpaceConversion: "none",
        premultiplyAlpha: "none",
      });
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        bitmap.close();
        return { data: original };
      }
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      flattenPolarDem(image.data, canvas.width, canvas.height, row === 0);
      context.putImageData(image, 0, 0);
      const encoded = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (!encoded) {
        return { data: original };
      }
      return { data: await encoded.arrayBuffer() };
    } catch (error) {
      console.warn("No se pudo aplanar el borde polar. Se usa la tesela original.", error);
      return { data: original };
    }
  });
}

export function planetPreviewEnabled(): boolean {
  return typeof window !== "undefined";
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

function paintPreviewSky(map: MapLibreMap): void {
  if (map.getProjection()?.type !== "globe") {
    return;
  }
  try {
    map.setSky(PREVIEW_SKY);
  } catch (error) {
    console.warn("La atmósfera del planeta no se aplicó.", error);
  }
}

function paintOceanFill(map: MapLibreMap): void {
  if (!map.getLayer("water")) {
    return;
  }
  map.setPaintProperty("water", "fill-color", OCEAN_FILL);
  map.setPaintProperty("water", "fill-opacity", OCEAN_FILL_OPACITY);
}

function restoreOcean(map: MapLibreMap): void {
  if (!map.getLayer("water")) {
    return;
  }
  map.setPaintProperty("water", "fill-color", EXPEDITION_WATER);
  map.setPaintProperty("water", "fill-opacity", 1);
  try {
    map.setSky(PLANET_SKY);
  } catch (error) {
    console.warn("No se pudo devolver el cielo de la expedición.", error);
  }
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
    console.warn("El estilo no tiene la capa water. No se aplicó la superficie del planeta.");
    return;
  }
  if (!map.getSource(PLANET_DEM_SOURCE)) {
    map.addSource(PLANET_DEM_SOURCE, {
      type: "raster-dem",
      tiles: [PLANET_DEM_URL],
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
      // 30°: en terreno plano el sombreado sale con alfa 0. Más alto, el
      // casquete plano del polo se apila y queda un disco gris.
      "hillshade-illumination-altitude": 30,
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
    console.warn("El relieve del planeta no respondió. La superficie original sigue activa.", error);
    return;
  }

  try {
    if (!map.getStyle() || retired.has(map) || map.getLayer(OCEAN_ID)) {
      return;
    }
    await registerDemProtocol();
    addPlanetLayers(map);
    paintPreviewSky(map);
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
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    (window as Window & { __planetMap?: MapLibreMap }).__planetMap = map;
  }
  if (!planetPreviewEnabled() || retired.has(map)) {
    return;
  }
  paintPreviewSky(map);
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
