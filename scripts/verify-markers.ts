import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { buildEncounterPins, buildZonePins, collapsePins, REGIONAL_ZOOM } from "../src/lib/expedition/pins";
import type { Sighting } from "../src/lib/expedition/argentina";
import { markerBand } from "../src/lib/map/marker-band";

const sightings: Sighting[] = [
  { id: "kanto-025", expeditionNumber: 6, nationalId: 25, speciesName: "pikachu", zoneId: "puerto-iguazu", latitude: -25.62, longitude: -54.6 },
  { id: "kanto-052", expeditionNumber: 1, nationalId: 52, speciesName: "meowth", zoneId: "buenos-aires", latitude: -34.61, longitude: -58.4 },
];
const names = new Map([["pikachu", "Pikachu"]]);
const seen = new Set(["kanto-025", "kanto-052"]);
const caught = new Set(["kanto-025"]);
const pins = buildEncounterPins(EXPEDITION_ZONES, sightings, names, seen, caught);
const pikachu = pins.find((pin) => pin.id === "kanto-025");
const meowth = pins.find((pin) => pin.id === "kanto-052");
if (!pikachu?.spriteStill || !pikachu.spriteAnimated || pikachu.presence !== "caught") {
  throw new Error("el capturado no tiene sprite");
}
if (pikachu.shortLabel.toLowerCase().includes("???")) throw new Error("el capturado perdió el nombre accesible");
if (meowth?.spriteStill || meowth?.presence !== "seen") throw new Error("el visto no debe llevar sprite");
const hidden = buildEncounterPins(EXPEDITION_ZONES, sightings, names, new Set(), new Set());
if (hidden.some((pin) => pin.spriteStill || pin.shortLabel !== "???")) throw new Error("el oculto se reveló");

const zones = buildZonePins(EXPEDITION_ZONES, sightings);
const iguazu = zones.find((pin) => pin.zoneId === "puerto-iguazu");
if (iguazu?.count !== 1 || !iguazu.shortLabel.includes("Salsipuedes") || iguazu.latitude !== -31.1372) {
  throw new Error("sello regional");
}

if (markerBand(1.8, 1440) !== "global") throw new Error("global");
if (markerBand(4, 1440) !== "regional") throw new Error("regional");
if (markerBand(REGIONAL_ZOOM, 390) !== "detail") throw new Error("detalle");
if (markerBand(3, 390) !== "regional") throw new Error("teléfono");

const stacked = collapsePins(pins, () => ({ x: 0, y: 0 }));
if (stacked.length !== 1 || stacked[0]?.kind !== "stack") throw new Error("agrupación");

console.log("OK markers caught=sprite hidden=sealed bands=3");
