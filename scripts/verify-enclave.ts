import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { ENCLAVES } from "../src/lib/expedition/enclaves";
import { isEastOfChile } from "../src/lib/expedition/geography";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { buildFieldSightings } from "../src/lib/expedition/sightings";
import { containsArgentina } from "../src/lib/map/argentina-hit";

function fail(message: string): never {
  throw new Error(message);
}

const enclave = ENCLAVES[0];
if (ENCLAVES.length !== 1 || !enclave || enclave.scene !== "glacial") {
  fail("Este bloque tiene un solo enclave, el santuario glacial.");
}

const card = KANTO_CATALOG.find((entry) => entry.encounterId === enclave.encounterId);
if (!card || card.role !== "reserved" || card.nationalId !== 144 || card.speciesName !== "articuno") {
  fail("El santuario no apunta a Articuno reservado.");
}
if (KANTO_CATALOG.length !== 56 || KANTO_CATALOG.filter((entry) => entry.role === "field").length !== 50) {
  fail("El catálogo de 56 dejó de estar intacto.");
}

if (!containsArgentina(enclave.point) || !isEastOfChile(enclave.point)) {
  fail("El santuario no cae dentro de Argentina.");
}

const moreno = EXPEDITION_ZONES.find((zone) => zone.id === "perito-moreno");
if (!moreno) {
  fail("Falta la zona del glaciar.");
}
const outsideFieldBox =
  enclave.point.latitude < moreno.bounds.south ||
  enclave.point.latitude > moreno.bounds.north ||
  enclave.point.longitude < moreno.bounds.west ||
  enclave.point.longitude > moreno.bounds.east;
if (!outsideFieldBox) {
  fail("El santuario quedó dentro del rectángulo de encuentros de campo.");
}

const sightings = buildFieldSightings();
if (sightings.length !== 50) {
  fail(`Los encuentros de campo son ${sightings.length}.`);
}
if (sightings.some((sighting) => sighting.id === enclave.encounterId)) {
  fail("El reservado se colocó como encuentro normal.");
}

const hidden = `${enclave.anomaly} ${enclave.sealed} Anomalía sin identificar. Señal glacial en ${enclave.region}.`;
for (const name of ["articuno", "zapdos", "moltres", "mewtwo", "mew", "aerodactyl"]) {
  if (hidden.toLowerCase().includes(name)) {
    fail(`El texto previo nombra a ${name}.`);
  }
}

console.log(
  `OK enclave=${enclave.id} lat=${enclave.point.latitude} lon=${enclave.point.longitude} field=${sightings.length}`,
);
