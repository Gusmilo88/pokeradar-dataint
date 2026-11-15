import { readFileSync } from "node:fs";
import {
  PLANET_DEM_ENCODING,
  PLANET_DEM_MAX_ZOOM,
  PLANET_DEM_TILE_SIZE,
  PLANET_DEM_TILES,
  PLANET_PREVIEW_PARAM,
  planetPreviewEnabled,
} from "../src/lib/map/planet-preview";
import {
  NORTH_CAP_ELEVATION,
  POLAR_BLEND_ROWS,
  SOUTH_CAP_ELEVATION,
  decodeTerrarium,
  encodeTerrarium,
  flattenPolarDem,
  isPolarDemTile,
} from "../src/lib/map/planet-poles";

if (planetPreviewEnabled()) {
  throw new Error("el prototipo no debe activarse fuera del navegador de desarrollo");
}
if (PLANET_PREVIEW_PARAM !== "planetPreview") {
  throw new Error("el parámetro de activación cambió");
}
if (PLANET_DEM_ENCODING !== "terrarium" || !PLANET_DEM_TILES.includes("elevation-tiles-prod")) {
  throw new Error("la fuente de relieve no es Terrarium de AWS Open Data");
}
if (PLANET_DEM_TILE_SIZE !== 256 || PLANET_DEM_MAX_ZOOM > 12) {
  throw new Error("la tesela de relieve no está acotada");
}

const preview = readFileSync(new URL("../src/lib/map/planet-preview.ts", import.meta.url), "utf8");
if (/\.(setTerrain|setProjection|jumpTo)\s*\(/.test(preview)) {
  throw new Error("el prototipo no puede mover el globo ni extruir el terreno");
}
if (!preview.includes("color-relief") || !preview.includes("hillshade") || !preview.includes("ETOPO1")) {
  throw new Error("faltan el color de elevación, el sombreado o la atribución de batimetría");
}
if (!preview.includes('fill-opacity", 1')) {
  throw new Error("el océano del estilo no tiene restauración");
}

const style = readFileSync(new URL("../src/lib/map/expedition-style.ts", import.meta.url), "utf8");
if (style.includes("planet-dem") || style.includes("planetPreview") || style.includes("setTerrain")) {
  throw new Error("el estilo de la expedición fue modificado");
}

const globe = readFileSync(new URL("../src/lib/map/globe.ts", import.meta.url), "utf8");
if (globe.includes("planet-dem") || globe.includes("setTerrain")) {
  throw new Error("la proyección del globo fue modificada");
}

const view = readFileSync(new URL("../src/components/map/map-view.tsx", import.meta.url), "utf8");
const calls = view.match(/applyPlanetPreview\(activeMap\)/g) ?? [];
if (calls.length !== 2) {
  throw new Error("el prototipo tiene que engancharse al estilo sin reescribir el mapa");
}
if (view.includes("setTerrain") || view.includes("planet-dem")) {
  throw new Error("la vista no debe cargar el DEM por su cuenta");
}

if (/cloud|nube|clouds\.webp|getCameraAltitude/i.test(preview)) {
  throw new Error("la capa de nubes sigue en el prototipo");
}
if (!preview.includes("planetdem://dem/") || !preview.includes("OCEAN_FILL_OPACITY = 1")) {
  throw new Error("el borde polar o el océano opaco del prototipo no quedaron aislados");
}
if (!isPolarDemTile(0, 0) || !isPolarDemTile(3, 7) || isPolarDemTile(3, 1) || isPolarDemTile(3, 8)) {
  throw new Error("la tesela polar no se reconoce");
}
const packed = new Uint8ClampedArray(4);
encodeTerrarium(NORTH_CAP_ELEVATION, packed, 0);
if (Math.abs(decodeTerrarium(packed[0] ?? 0, packed[1] ?? 0, packed[2] ?? 0) - NORTH_CAP_ELEVATION) > 0.01) {
  throw new Error("la cota del polo norte no sobrevive el Terrarium");
}
encodeTerrarium(SOUTH_CAP_ELEVATION, packed, 0);
if (Math.abs(decodeTerrarium(packed[0] ?? 0, packed[1] ?? 0, packed[2] ?? 0) - SOUTH_CAP_ELEVATION) > 0.01) {
  throw new Error("la cota del polo sur no sobrevive el Terrarium");
}
const width = 8;
const height = 64;
const tile = new Uint8ClampedArray(width * height * 4);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    encodeTerrarium(1000 + x * 50, tile, (y * width + x) * 4);
  }
}
flattenPolarDem(tile, width, height, true);
const edgeLeft = decodeTerrarium(tile[0] ?? 0, tile[1] ?? 0, tile[2] ?? 0);
const edgeRight = decodeTerrarium(tile[28] ?? 0, tile[29] ?? 0, tile[30] ?? 0);
if (Math.abs(edgeLeft - edgeRight) > 0.05) {
  throw new Error("el borde norte no quedó plano");
}
const inlandIndex = 50 * width * 4 + 3 * 4;
const inland = decodeTerrarium(tile[inlandIndex] ?? 0, tile[inlandIndex + 1] ?? 0, tile[inlandIndex + 2] ?? 0);
if (Math.abs(inland - 1150) > 0.05) {
  throw new Error("el aplanado polar modificó el interior de la tesela");
}
if (POLAR_BLEND_ROWS < 8) {
  throw new Error("el borde plano no cubre la fila que el globo estira");
}
if (Math.abs(edgeLeft - NORTH_CAP_ELEVATION) > 0.05) {
  throw new Error("el borde norte no usa la cota única del casquete");
}

console.log("OK planet-preview aislado terrarium maxzoom=" + String(PLANET_DEM_MAX_ZOOM));
