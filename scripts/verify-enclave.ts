import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { ENCLAVES } from "../src/lib/expedition/enclaves";
import { containsBounds, isEastOfChile } from "../src/lib/expedition/geography";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { buildFieldSightings } from "../src/lib/expedition/sightings";
import { containsArgentina } from "../src/lib/map/argentina-hit";

function fail(message: string): never {
  throw new Error(message);
}

const expected = [
  { id: "santuario-glacial", scene: "glacial", nationalId: 144, speciesName: "articuno" },
  { id: "central-electrica", scene: "storm", nationalId: 145, speciesName: "zapdos" },
  { id: "santuario-volcanico", scene: "ember", nationalId: 146, speciesName: "moltres" },
] as const;

if (ENCLAVES.length !== expected.length) {
  fail(`Hay ${ENCLAVES.length} enclaves. Este bloque espera ${expected.length}.`);
}

const sightings = buildFieldSightings();
if (sightings.length !== 50) {
  fail(`Los encuentros de campo son ${sightings.length}.`);
}
const outside = sightings.filter((sighting) => !containsArgentina(sighting));
if (outside.length > 0) {
  fail(
    `Fuera del polígono de Argentina, incluida la frontera con Paraguay y Brasil: ${outside
      .map((sighting) => `${sighting.speciesName} ${sighting.zoneId} ${sighting.latitude.toFixed(4)},${sighting.longitude.toFixed(4)}`)
      .join("; ")}.`,
  );
}
if (KANTO_CATALOG.length !== 56 || KANTO_CATALOG.filter((entry) => entry.role === "field").length !== 50) {
  fail("El catálogo de 56 dejó de estar intacto.");
}

for (const spec of expected) {
  const enclave = ENCLAVES.find((item) => item.id === spec.id);
  if (!enclave || enclave.scene !== spec.scene) {
    fail(`Falta el enclave ${spec.id}.`);
  }
  const card = KANTO_CATALOG.find((entry) => entry.encounterId === enclave.encounterId);
  if (!card || card.role !== "reserved" || card.nationalId !== spec.nationalId || card.speciesName !== spec.speciesName) {
    fail(`${spec.id} no apunta al reservado ${spec.speciesName}.`);
  }
  if (!containsArgentina(enclave.point) || !isEastOfChile(enclave.point)) {
    fail(`${spec.id} no cae dentro de Argentina.`);
  }
  if (EXPEDITION_ZONES.some((zone) => containsBounds(zone.bounds, enclave.point))) {
    fail(`${spec.id} quedó dentro de un rectángulo de encuentros de campo.`);
  }
  if (sightings.some((sighting) => sighting.id === enclave.encounterId)) {
    fail(`${spec.speciesName} se colocó como encuentro normal.`);
  }
  const hidden = `${enclave.anomaly} ${enclave.sealed} ${enclave.exterior} ${enclave.interior} Anomalía sin identificar. ${enclave.signal} en ${enclave.region}.`;
  for (const name of ["articuno", "zapdos", "moltres", "mewtwo", "mew", "aerodactyl"]) {
    if (hidden.toLowerCase().includes(name)) {
      fail(`El texto previo de ${spec.id} nombra a ${name}.`);
    }
  }
}

console.log(ENCLAVES.map((enclave) => `${enclave.id} ${enclave.point.latitude},${enclave.point.longitude}`).join(" "));
