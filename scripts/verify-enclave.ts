import { ARGENTINA_VIEW, EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { ENCLAVES } from "../src/lib/expedition/enclaves";
import { containsBounds, isEastOfChile } from "../src/lib/expedition/geography";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { buildFieldSightings } from "../src/lib/expedition/sightings";
import { ATLAS_FRAMES } from "../src/lib/map/atlas-frames";
import { globeHomeZoom } from "../src/lib/map/globe";
import {
  ATLANTIC_LABELS,
  atlanticBounds,
  atlanticPartCount,
  containsFalklands,
  containsSouthGeorgia,
  containsSouthSandwich,
} from "../src/lib/map/atlantic-hit";
import { containsArgentina } from "../src/lib/map/argentina-hit";
import {
  containsTierraDelFuego,
  LAGO_ESCONDIDO_REFERENCE,
  outsideLagoEscondido,
} from "../src/lib/map/tierra-del-fuego-hit";

function km(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const radius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function fail(message: string): never {
  throw new Error(message);
}

const expected = [
  { id: "santuario-glacial", scene: "glacial", nationalId: 144, speciesName: "articuno" },
  { id: "central-electrica", scene: "storm", nationalId: 145, speciesName: "zapdos" },
  { id: "santuario-volcanico", scene: "ember", nationalId: 146, speciesName: "moltres" },
  { id: "caverna-fosil", scene: "fossil", nationalId: 142, speciesName: "aerodactyl" },
  { id: "laboratorio-secreto", scene: "lab", nationalId: 150, speciesName: "mewtwo" },
  { id: "refugio-escondido", scene: "grove", nationalId: 151, speciesName: "mew" },
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
  const onContinent = containsArgentina(enclave.point) && isEastOfChile(enclave.point);
  if (spec.id === "refugio-escondido") {
    if (containsArgentina(enclave.point)) {
      fail("El Refugio Escondido quedó dentro del polígono continental.");
    }
    if (!containsSouthGeorgia(enclave.point)) {
      fail("El Refugio Escondido no cae en Georgia del Sur.");
    }
    if (enclave.point.latitude !== -54.4408 || enclave.point.longitude !== -36.5556) {
      fail("El Refugio Escondido se movió del monte Paget.");
    }
    if ((enclave.arrival ?? "").toLowerCase().includes("legend")) {
      fail("El refugio quedó etiquetado como legendario.");
    }
    if (containsSouthGeorgia({ latitude: -53.7, longitude: -36.5 })) {
      fail("El mar al norte de Georgia del Sur se leyó como tierra.");
    }
    if (containsSouthGeorgia({ latitude: -34.6, longitude: -58.4 })) {
      fail("Buenos Aires se leyó como Georgia del Sur.");
    }
  } else if (spec.id === "laboratorio-secreto") {
    if (containsArgentina(enclave.point)) {
      fail("El Laboratorio Secreto quedó dentro del polígono continental.");
    }
    if (!containsFalklands(enclave.point)) {
      fail("El Laboratorio Secreto no cae en las Malvinas.");
    }
    if (enclave.point.latitude !== -51.7002 || enclave.point.longitude !== -58.8259) {
      fail("El Laboratorio Secreto se movió del monte Usborne.");
    }
    if (enclave.region !== "Islas Malvinas") {
      fail("El laboratorio no quedó en Islas Malvinas.");
    }
  } else if (spec.id === "santuario-glacial") {
    if (!onContinent || !containsTierraDelFuego(enclave.point)) {
      fail("El Santuario Glacial no cae en tierra de Tierra del Fuego.");
    }
    if (enclave.point.latitude !== -54.638 || enclave.point.longitude !== -67.759) {
      fail("El Santuario Glacial se movió de Lago Escondido.");
    }
    if (!outsideLagoEscondido(enclave.point)) {
      fail("El Santuario Glacial quedó sobre el Lago Escondido.");
    }
    if (km(enclave.point, LAGO_ESCONDIDO_REFERENCE) > 8) {
      fail("El Santuario Glacial quedó lejos del Lago Escondido.");
    }
    if (enclave.region !== "Tierra del Fuego") {
      fail("El santuario no quedó en Tierra del Fuego.");
    }
  } else if (!onContinent) {
    fail(`${spec.id} no cae dentro de Argentina.`);
  }
  if (EXPEDITION_ZONES.some((zone) => containsBounds(zone.bounds, enclave.point))) {
    fail(`${spec.id} quedó dentro de un rectángulo de encuentros de campo.`);
  }
  if (sightings.some((sighting) => sighting.id === enclave.encounterId)) {
    fail(`${spec.speciesName} se colocó como encuentro normal.`);
  }
  if (spec.id === "caverna-fosil") {
    if (enclave.point.latitude !== -30.12 || enclave.point.longitude !== -67.85) {
      fail("La Caverna Fósil se movió de Ischigualasto.");
    }
    if ((enclave.arrival ?? "").toLowerCase().includes("legend")) {
      fail("La Caverna Fósil quedó etiquetada como legendaria.");
    }
  }
  if (spec.id === "central-electrica") {
    if (enclave.point.latitude !== -40.58 || enclave.point.longitude !== -70.98) {
      fail("La Central Eléctrica se movió.");
    }
  }
  if (spec.id === "santuario-volcanico") {
    if (enclave.point.latitude !== -36.42 || enclave.point.longitude !== -69.2) {
      fail("El Santuario Volcánico se movió.");
    }
  }
  const hidden = `${enclave.anomaly} ${enclave.sealed} ${enclave.exterior} ${enclave.interior} Anomalía sin identificar. ${enclave.signal} en ${enclave.region}.`;
  for (const name of ["articuno", "zapdos", "moltres", "mewtwo", "mew", "aerodactyl"]) {
    if (hidden.toLowerCase().includes(name)) {
      fail(`El texto previo de ${spec.id} nombra a ${name}.`);
    }
  }
}

if (containsFalklands({ latitude: -51.7, longitude: -57.4 })) {
  fail("El mar al este de Malvinas se leyó como tierra.");
}
if (containsFalklands({ latitude: -51.85, longitude: -59.55 })) {
  fail("El canal entre las Malvinas se leyó como tierra.");
}
if (containsFalklands({ latitude: -34.6, longitude: -58.4 })) {
  fail("Buenos Aires se leyó como Malvinas.");
}
if (!containsSouthSandwich({ latitude: -59.4545, longitude: -27.1949 })) {
  fail("Una isla Sandwich no se leyó como tierra.");
}
if (containsSouthSandwich({ latitude: -58, longitude: -25 })) {
  fail("El mar al este de las Sandwich se leyó como tierra.");
}
if (containsSouthGeorgia({ latitude: -51.7002, longitude: -58.8259 })) {
  fail("El monte Usborne se leyó como Georgia del Sur.");
}
if (containsTierraDelFuego({ latitude: -34.6, longitude: -58.4 })) {
  fail("Buenos Aires se leyó como Tierra del Fuego.");
}
if (containsTierraDelFuego({ latitude: -54.934, longitude: -67.616 })) {
  fail("Puerto Williams se leyó como Tierra del Fuego.");
}
if (atlanticPartCount("malvinas") !== 15 || atlanticPartCount("georgias") !== 3 || atlanticPartCount("sandwich") !== 9) {
  fail("Los grupos insulares dejaron de estar partidos.");
}
const bounds = {
  malvinas: atlanticBounds("malvinas"),
  georgias: atlanticBounds("georgias"),
  sandwich: atlanticBounds("sandwich"),
};
const groups = [bounds.malvinas, bounds.georgias, bounds.sandwich];
for (let index = 0; index < groups.length; index += 1) {
  for (let other = index + 1; other < groups.length; other += 1) {
    const left = groups[index];
    const right = groups[other];
    if (!left || !right) {
      continue;
    }
    const crosses =
      left.west <= right.east &&
      right.west <= left.east &&
      left.south <= right.north &&
      right.south <= left.north;
    if (crosses) {
      fail("Dos grupos insulares se solapan.");
    }
  }
}
if (ATLANTIC_LABELS.map((label) => label.name).join("|") !== "ISLAS MALVINAS|ISLAS GEORGIAS DEL SUR|ISLAS SANDWICH DEL SUR") {
  fail("Las etiquetas insulares cambiaron.");
}
for (const label of ATLANTIC_LABELS) {
  const point = { latitude: label.latitude, longitude: label.longitude };
  if (containsFalklands(point) || containsSouthGeorgia(point) || containsSouthSandwich(point)) {
    fail(`La etiqueta ${label.name} cae sobre tierra.`);
  }
}
if (ATLAS_FRAMES.map((frame) => frame.id).join(",") !== "continental,fuego,malvinas,georgias") {
  fail("El navegador de regiones cambió.");
}
for (const frame of ATLAS_FRAMES) {
  for (const name of ["articuno", "zapdos", "moltres", "mewtwo", "mew", "aerodactyl"]) {
    if (frame.label.toLowerCase().includes(name)) {
      fail(`La región ${frame.id} nombra a ${name}.`);
    }
  }
}
const continental = ATLAS_FRAMES[0];
if (
  !continental ||
  continental.zoom !== ARGENTINA_VIEW.zoom ||
  continental.longitude !== ARGENTINA_VIEW.center[0] ||
  continental.latitude !== ARGENTINA_VIEW.center[1]
) {
  fail("La vista continental ya no es el encuadre nacional.");
}
const glacial = ENCLAVES.find((enclave) => enclave.id === "santuario-glacial");
const laboratory = ENCLAVES.find((enclave) => enclave.id === "laboratorio-secreto");
const refuge = ENCLAVES.find((enclave) => enclave.id === "refugio-escondido");
const fuego = ATLAS_FRAMES.find((frame) => frame.id === "fuego");
const malvinas = ATLAS_FRAMES.find((frame) => frame.id === "malvinas");
const georgias = ATLAS_FRAMES.find((frame) => frame.id === "georgias");
if (!glacial || !fuego || fuego.latitude !== glacial.point.latitude || fuego.longitude !== glacial.point.longitude) {
  fail("Tierra del Fuego no encuadra el santuario.");
}
if (!refuge || !georgias || georgias.latitude !== refuge.point.latitude || georgias.longitude !== refuge.point.longitude) {
  fail("Georgias del Sur no encuadra el refugio.");
}
if (!laboratory || !malvinas || km(laboratory.point, malvinas) > 80) {
  fail("Malvinas no encuadra el laboratorio.");
}
if (malvinas && (malvinas.longitude < bounds.malvinas.west - 0.5 || malvinas.longitude > bounds.malvinas.east + 0.5 || malvinas.latitude < bounds.malvinas.south - 0.5 || malvinas.latitude > bounds.malvinas.north + 0.5)) {
  fail("El encuadre de Malvinas quedó fuera del archipiélago.");
}
for (const frame of ATLAS_FRAMES) {
  if (frame.id !== "continental" && (frame.zoom <= ARGENTINA_VIEW.zoom || frame.zoom > 8)) {
    fail(`El zoom de ${frame.id} aleja el país o se acerca de más.`);
  }
}
for (let index = 0; index < ENCLAVES.length; index += 1) {
  const enclave = ENCLAVES[index];
  if (!enclave) {
    continue;
  }
  for (let other = index + 1; other < ENCLAVES.length; other += 1) {
    const neighbor = ENCLAVES[other];
    if (neighbor && km(enclave.point, neighbor.point) < 80) {
      fail(`${enclave.id} se superpone con ${neighbor.id}.`);
    }
  }
  for (const sighting of sightings) {
    if (km(enclave.point, sighting) < 25) {
      fail(`${enclave.id} pisa el encuentro ${sighting.id}.`);
    }
  }
}

for (const [name, width, height] of [
  ["1920x1080", 1920, 1080],
  ["1440x900", 1440, 900],
  ["960x600", 960, 600],
  ["390x844", 390, 844],
] as const) {
  const zoom = globeHomeZoom(width, height);
  if (zoom < 1.15 || zoom > 2.05 || zoom >= ARGENTINA_VIEW.zoom) {
    fail(`El zoom inicial del globo en ${name} es ${zoom}.`);
  }
}

console.log(ENCLAVES.map((enclave) => `${enclave.id} ${enclave.point.latitude},${enclave.point.longitude}`).join(" "));
