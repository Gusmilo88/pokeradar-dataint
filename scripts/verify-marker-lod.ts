import { ENCLAVES } from "../src/lib/expedition/enclaves";
import { buildEnclavePins, buildZonePins, REGIONAL_ZOOM } from "../src/lib/expedition/pins";
import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { buildFieldSightings } from "../src/lib/expedition/sightings";
import { containsArgentina } from "../src/lib/map/argentina-hit";
import { FAR_ZOOM, markerLod, markerVisualScale } from "../src/lib/map/marker-lod";
import { markerBand } from "../src/lib/map/marker-band";

const SPECIALS = [
  ["santuario-glacial", -54.638, -67.759],
  ["central-electrica", -40.58, -70.98],
  ["santuario-volcanico", -26.5035, -61.1765],
  ["caverna-fosil", -30.12, -67.85],
  ["laboratorio-secreto", -51.7002, -58.8259],
  ["refugio-escondido", -54.4408, -36.5556],
] as const;

if (ENCLAVES.length !== 6) throw new Error("faltan enclaves");
const pins = buildEnclavePins(ENCLAVES, new Set(), new Map());
for (const [id, latitude, longitude] of SPECIALS) {
  const source = ENCLAVES.find((enclave) => enclave.id === id);
  const pin = pins.find((item) => item.id === id);
  if (!source || !pin) throw new Error(`falta ${id}`);
  if (source.point.latitude !== latitude || source.point.longitude !== longitude) {
    throw new Error(`${id} cambió de coordenada`);
  }
  if (pin.latitude !== source.point.latitude || pin.longitude !== source.point.longitude) {
    throw new Error(`${id} no conserva el ancla`);
  }
}

const salsipuedes = EXPEDITION_ZONES.find((zone) => zone.id === "puerto-iguazu");
const cataratas = EXPEDITION_ZONES.find((zone) => zone.id === "cataratas-iguazu");
if (!salsipuedes || salsipuedes.name !== "Salsipuedes" || salsipuedes.anchor.latitude !== -31.1372 || salsipuedes.anchor.longitude !== -64.2958) {
  throw new Error("Salsipuedes no quedó en su ancla");
}
if (!cataratas || cataratas.name !== "Cataratas del Iguazú" || cataratas.anchor.latitude !== -25.68988 || cataratas.anchor.longitude !== -54.44369) {
  throw new Error("Cataratas se movió");
}
const forestIds = KANTO_CATALOG.filter((entry) => entry.role === "field" && entry.zoneId === "puerto-iguazu").map((entry) => entry.encounterId);
if (forestIds.length !== 7) throw new Error("Salsipuedes no conserva las 7 especies");
const placed = buildFieldSightings().filter((sighting) => sighting.zoneId === "puerto-iguazu");
if (placed.length !== 7 || placed.some((sighting) => !forestIds.includes(sighting.id))) {
  throw new Error("las señales de Salsipuedes no son las originales");
}
for (const sighting of placed) {
  const north = Math.abs(sighting.latitude - salsipuedes.anchor.latitude) * 110.574;
  const east = Math.abs(sighting.longitude - salsipuedes.anchor.longitude) * 111.32 * Math.cos((salsipuedes.anchor.latitude * Math.PI) / 180);
  if (Math.hypot(north, east) > 12 || !containsArgentina({ latitude: sighting.latitude, longitude: sighting.longitude })) {
    throw new Error(`${sighting.id} quedó fuera de Salsipuedes`);
  }
}
const falls = buildFieldSightings().filter((sighting) => sighting.zoneId === "cataratas-iguazu");
if (falls.length !== 4 || falls.some((sighting) => sighting.latitude < -25.72 || sighting.latitude > -25.68)) {
  throw new Error("Cataratas cambió de encuentros");
}
const seenOnly = buildEnclavePins(ENCLAVES, new Set(["kanto-146"]), new Map());
const caughtOne = buildEnclavePins(ENCLAVES, new Set(["kanto-146"]), new Map(), new Set(["kanto-146"]));
if (seenOnly.some((pin) => pin.presence === "caught")) throw new Error("ver un especial lo convierte en estrella");
if (caughtOne.filter((pin) => pin.presence === "caught").length !== 1 || caughtOne.find((pin) => pin.id === "santuario-volcanico")?.presence !== "caught") {
  throw new Error("la captura no marca la estrella");
}

const zones = buildZonePins(EXPEDITION_ZONES, []);
for (const zone of EXPEDITION_ZONES) {
  const pin = zones.find((item) => item.zoneId === zone.id);
  if (!pin || pin.latitude !== zone.anchor.latitude || pin.longitude !== zone.anchor.longitude) {
    throw new Error(`${zone.id} perdió el ancla`);
  }
}

if (markerLod(1.4) !== "far" || markerLod(FAR_ZOOM) !== "mid" || markerLod(REGIONAL_ZOOM) !== "near") {
  throw new Error("distancias");
}
if (markerBand(1.4) !== "global" || markerBand(3.8) !== "regional" || markerBand(REGIONAL_ZOOM) !== "detail") {
  throw new Error("bandas");
}
if (markerLod(1.4) === "near" || markerLod(3.8) === "near") throw new Error("los encuentros aparecen demasiado lejos");
const farScale = markerVisualScale(1.2);
const nearScale = markerVisualScale(8);
if (farScale < 0.78 || farScale >= 1 || nearScale !== 1) throw new Error("escala");

console.log("OK anchor 6 specials zones=fixed lod=3");
