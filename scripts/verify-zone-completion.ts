import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { buildZonePins } from "../src/lib/expedition/pins";
import { isFieldWild, TIME_WINDOWS } from "../src/lib/expedition/schedule";
import { isZoneCompleted, zoneSpeciesIds } from "../src/lib/expedition/zone-completion";
import type { Sighting } from "../src/lib/expedition/argentina";

const night = new Date("2026-11-15T04:38:00Z");
const noon = new Date("2026-11-15T15:00:00Z");

for (const zone of EXPEDITION_ZONES) {
  const species = zoneSpeciesIds(zone.id);
  if (species.length !== zone.quota) {
    throw new Error(`${zone.id} asigna ${species.length} y la cuota es ${zone.quota}`);
  }
}

const buenosAires = zoneSpeciesIds("buenos-aires");
const brujas = zoneSpeciesIds("caverna-brujas");
if (buenosAires.length !== 5) throw new Error("Buenos Aires no tiene sus 5 especies");
if (brujas.length !== 4) throw new Error("Brujas no tiene sus 4 especies");

for (const id of buenosAires) {
  if (!TIME_WINDOWS.some((window) => window.encounterId === id)) {
    throw new Error(`${id} de Buenos Aires quedó sin horario`);
  }
}
for (const id of brujas) {
  if (TIME_WINDOWS.some((window) => window.encounterId === id)) {
    throw new Error(`${id} de Brujas no debería tener horario`);
  }
}

const visibleAtNight = buenosAires.filter((id) => isFieldWild(id, night));
if (visibleAtNight.length === 0 || visibleAtNight.length === buenosAires.length) {
  throw new Error("la noche de prueba no separa las especies visibles de Buenos Aires");
}
if (isZoneCompleted("buenos-aires", new Set(visibleAtNight))) {
  throw new Error("Buenos Aires se completó solo con las especies visibles");
}
if (!isZoneCompleted("buenos-aires", new Set(buenosAires))) {
  throw new Error("Buenos Aires no se completa con el catálogo entero");
}
const closedAtNoon = buenosAires.filter((id) => !isFieldWild(id, noon));
if (closedAtNoon.length === 0) throw new Error("al mediodía todas las especies de Buenos Aires están activas");
if (!isZoneCompleted("buenos-aires", new Set(buenosAires))) {
  throw new Error("una especie fuera de horario dejó incompleta una zona ya capturada");
}

if (isZoneCompleted("caverna-brujas", new Set(brujas.slice(0, 3)))) {
  throw new Error("Brujas se completó con una especie pendiente");
}
if (!isZoneCompleted("caverna-brujas", new Set(brujas))) {
  throw new Error("Brujas no se completa al capturar sus 4 especies");
}

const activeOnly: Sighting[] = visibleAtNight.map((id, index) => ({
  id,
  expeditionNumber: index + 1,
  nationalId: index + 1,
  speciesName: id,
  zoneId: "buenos-aires",
  latitude: -34.6,
  longitude: -58.4,
}));
const partial = buildZonePins(EXPEDITION_ZONES, activeOnly, new Set(visibleAtNight));
const open = partial.find((pin) => pin.zoneId === "buenos-aires");
if (open?.complete || open?.count !== visibleAtNight.length) {
  throw new Error("el sello visible de Buenos Aires no debe ser estrella");
}
const finished = buildZonePins(EXPEDITION_ZONES, activeOnly, new Set(buenosAires));
if (!finished.find((pin) => pin.zoneId === "buenos-aires")?.complete) {
  throw new Error("el catálogo completo no reemplazó el número por la estrella");
}

console.log(
  `OK zones BA=${buenosAires.length} night=${visibleAtNight.length} brujas=${brujas.length}`,
);
