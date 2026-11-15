import { readFileSync } from "node:fs";
import {
  PLANET_DEM_ENCODING,
  PLANET_DEM_MAX_ZOOM,
  PLANET_DEM_TILE_SIZE,
  PLANET_DEM_TILES,
  PLANET_PREVIEW_PARAM,
  planetPreviewEnabled,
} from "../src/lib/map/planet-preview";

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

console.log("OK planet-preview aislado terrarium maxzoom=" + String(PLANET_DEM_MAX_ZOOM));
