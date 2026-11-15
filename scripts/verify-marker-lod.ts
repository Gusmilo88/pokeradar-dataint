import { ENCLAVES } from "../src/lib/expedition/enclaves";
import { buildEnclavePins, buildZonePins, REGIONAL_ZOOM } from "../src/lib/expedition/pins";
import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { FAR_ZOOM, markerLod, markerVisualScale } from "../src/lib/map/marker-lod";
import { markerBand } from "../src/lib/map/marker-band";

const SPECIALS = [
  ["santuario-glacial", -54.638, -67.759],
  ["central-electrica", -40.58, -70.98],
  ["santuario-volcanico", -36.42, -69.2],
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
