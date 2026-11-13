import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { explorationHint, RESERVED_HINT } from "../src/lib/expedition/hints";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import {
  discoveryState,
  emptyProgress,
  markCaught,
  markSeen,
  parseProgress,
  readProgress,
  serializeProgress,
  tally,
} from "../src/lib/expedition/progress";
import { blackWhiteAnimated, blackWhiteStill } from "../src/lib/pokeapi/sprites";

function fail(message: string): never {
  throw new Error(message);
}

const field = KANTO_CATALOG.find((entry) => entry.role === "field");
const reserved = KANTO_CATALOG.filter((entry) => entry.role === "reserved");
if (!field) {
  fail("No hay un encuentro de campo.");
}
if (reserved.length !== 6) {
  fail(`Las reservadas son ${reserved.length}.`);
}

const blank = emptyProgress();
if (tally(blank).seen !== 0 || tally(blank).caught !== 0) {
  fail("La expedición nueva no arranca en cero.");
}
if (discoveryState(blank, field.encounterId) !== "undiscovered") {
  fail("Una ficha nueva no está sin descubrir.");
}

const seen = markSeen(blank, field.encounterId);
if (discoveryState(seen, field.encounterId) !== "seen" || tally(seen).seen !== 1) {
  fail("La revelación no pasó a visto.");
}
if (markSeen(seen, field.encounterId) !== seen) {
  fail("Revelar dos veces duplicó el registro.");
}
if (markSeen(blank, "kanto-000") !== blank) {
  fail("Un id ajeno al catálogo se guardó.");
}

const caught = markCaught(seen, field.encounterId);
if (discoveryState(caught, field.encounterId) !== "caught" || tally(caught).caught !== 1) {
  fail("El estado capturado no quedó preparado.");
}
if (markSeen(caught, field.encounterId) !== caught) {
  fail("Visto volvió atrás desde capturado.");
}

const roundTrip = parseProgress(serializeProgress(seen));
if (!roundTrip || discoveryState(roundTrip, field.encounterId) !== "seen") {
  fail("El progreso no sobrevivió el esquema.");
}

const caughtOnly = parseProgress(
  JSON.stringify({ version: 1, seen: [], caught: [field.encounterId] }),
);
if (!caughtOnly || discoveryState(caughtOnly, field.encounterId) !== "caught") {
  fail("Un capturado sin visto no se leyó.");
}
if (!caughtOnly.seen.has(field.encounterId)) {
  fail("Capturado no implica visto en el registro.");
}

if (parseProgress("no es json") !== null) {
  fail("Un texto roto se aceptó.");
}
if (parseProgress(JSON.stringify({ version: 2, seen: [], caught: [] })) !== null) {
  fail("Otra versión del esquema se aceptó.");
}
if (parseProgress(JSON.stringify({ version: 1, seen: ["kanto-000"], caught: [] })) !== null) {
  fail("Un id desconocido se aceptó.");
}
if (
  parseProgress(
    JSON.stringify({ version: 1, seen: [field.encounterId, field.encounterId], caught: [] }),
  ) !== null
) {
  fail("Un id repetido se aceptó.");
}
if (readProgress("{").seen.size !== 0 || readProgress(null).caught.size !== 0) {
  fail("La lectura inválida no volvió a cero.");
}

for (const entry of reserved) {
  if (entry.zoneId !== null) {
    fail(`${entry.encounterId} reservado tiene zona.`);
  }
  const hint = explorationHint(entry, null);
  if (hint !== RESERVED_HINT || hint.toLowerCase().includes(entry.speciesName)) {
    fail(`La pista reservada revela a ${entry.speciesName}.`);
  }
}

for (const entry of KANTO_CATALOG) {
  if (entry.role !== "field" || !entry.zoneId) {
    continue;
  }
  const zone = EXPEDITION_ZONES.find((item) => item.id === entry.zoneId) ?? null;
  const hint = explorationHint(entry, zone).toLowerCase();
  if (hint.includes(entry.speciesName) || (zone && hint.includes(zone.name.toLowerCase()))) {
    fail(`La pista de ${entry.encounterId} da una respuesta exacta.`);
  }
}

if (!blackWhiteStill(25).endsWith("/generation-v/black-white/25.png")) {
  fail("El PNG de Black & White no apunta al repositorio de sprites.");
}
if (!blackWhiteAnimated(25).endsWith("/generation-v/black-white/animated/25.gif")) {
  fail("El GIF de Black & White no apunta al repositorio de sprites.");
}

console.log("OK progress seen=1 caught=1 reserved=6 hints=field");
