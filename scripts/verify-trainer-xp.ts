import { readFileSync } from "node:fs";

import { evaluateBadges } from "../src/lib/badges/evaluate";
import { emptyBadgeLedger } from "../src/lib/badges/ledger";
import { qaCatch } from "../src/lib/badges/qa";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import {
  emptyProgress,
  markCaught,
  markSeen,
  parseProgress,
  PROGRESS_VERSION,
  serializeProgress,
} from "../src/lib/expedition/progress";
import { addMember } from "../src/lib/expedition/team";
import {
  TRAINER_XP_CATALOG,
  TRAINER_XP_CATALOG_VERSION,
  TRAINER_XP_RETRIEVED_ON,
  type TrainerXpEntry,
} from "../src/lib/expedition/trainer-xp-catalog";
import { finishesUnlockedAt, validateCosmeticFinishes } from "../src/lib/expedition/trainer-rewards";
import {
  assessExpedition,
  captureXpShift,
  expeditionXp,
  isMaxLevel,
  levelForXp,
  levelThresholds,
  maxExpeditionXp,
  progressForXp,
  TRAINER_LEVEL_CAP,
  validateTrainerXpCatalog,
} from "../src/lib/expedition/trainer-xp";

function fail(message: string): never {
  throw new Error(message);
}

function xpOf(id: string): number {
  const row = TRAINER_XP_CATALOG.find((entry) => entry.encounterId === id);
  if (!row) {
    fail(`Sin XP de catálogo para ${id}.`);
  }
  return row.baseExperience;
}

function assertReady(caught: ReadonlySet<string>): {
  xp: number;
  level: number;
  highestLevel: number;
  percent: number;
  maxXp: number;
  atCap: boolean;
  xpToNext: number;
} {
  const report = assessExpedition(caught);
  if (!report.complete) {
    fail(report.issues.join(" "));
  }
  return report.progress;
}

const issues = validateTrainerXpCatalog(TRAINER_XP_CATALOG);
if (issues.length > 0) {
  fail(issues.join(" "));
}
if (TRAINER_XP_CATALOG_VERSION !== 1 || TRAINER_XP_RETRIEVED_ON !== "2026-11-14") {
  fail("La procedencia del catálogo de XP cambió sin actualizar la verificación.");
}
if (PROGRESS_VERSION !== 1) {
  fail("La XP no puede exigir otra versión de pokeradar.progress.v1.");
}

const maxXp = maxExpeditionXp();
if (maxXp !== 7894) {
  fail(`La XP máxima real es ${String(maxXp)}, se esperaba 7894.`);
}

const thresholds = levelThresholds(maxXp);
if (!thresholds || thresholds.length !== 9) {
  fail("La curva no tiene nueve umbrales.");
}
let previousGap = 0;
let cursor = 0;
for (const threshold of thresholds) {
  const gap = threshold - cursor;
  if (gap <= previousGap) {
    fail(`El umbral ${threshold} no exige más que el anterior.`);
  }
  previousGap = gap;
  cursor = threshold;
}
if (thresholds[8] !== maxXp) {
  fail("El nivel 10 no cierra en la XP máxima.");
}
for (let index = 0; index < thresholds.length; index += 1) {
  const threshold = thresholds[index];
  if (threshold === undefined) {
    fail("Falta un umbral.");
  }
  if (levelForXp(threshold - 1, maxXp) !== index + 1) {
    fail(`Justo bajo ${threshold} no queda en el nivel ${index + 1}.`);
  }
  if (levelForXp(threshold, maxXp) !== index + 2) {
    fail(`El umbral ${threshold} no abre el nivel ${index + 2}.`);
  }
}

const blank = assertReady(emptyProgress().caught);
if (blank.level !== 1 || blank.xp !== 0 || blank.percent !== 0 || blank.atCap || blank.xpToNext !== thresholds[0]) {
  fail("Sin capturas el entrenador no está en nivel 1 con 0 XP.");
}
if (isMaxLevel(blank.level) || !isMaxLevel(TRAINER_LEVEL_CAP)) {
  fail("El nivel máximo no está identificado.");
}

const seenOnly = markSeen(emptyProgress(), "kanto-025");
if (assertReady(seenOnly.caught).xp !== 0 || seenOnly.seen.size !== 1) {
  fail("Ver a Pikachu otorgó XP.");
}

const one = markCaught(emptyProgress(), "kanto-129");
const oneReport = assertReady(one.caught);
if (oneReport.xp !== 40 || oneReport.level !== 2) {
  fail(`Magikarp no dejó el nivel accesible: ${oneReport.xp} XP, nivel ${oneReport.level}.`);
}
if (markCaught(one, "kanto-129") !== one) {
  fail("Capturar a Magikarp dos veces duplicó el registro.");
}

const pikachu = assertReady(new Set(["kanto-025"]));
if (pikachu.xp !== 112 || pikachu.level !== 2) {
  fail(`Pikachu no aporta sus 112 de base_experience: ${pikachu.xp}.`);
}

const several = assertReady(new Set(["kanto-025", "kanto-129", "kanto-151"]));
if (several.xp !== 112 + 40 + 270) {
  fail(`La suma de tres especies es ${several.xp}.`);
}
if (several.level !== levelForXp(several.xp, maxXp)) {
  fail("El nivel de varias especies no sale de la curva.");
}

const duplicate = captureXpShift(new Set(["kanto-025"]), "kanto-025");
if (!("counted" in duplicate) || duplicate.counted || duplicate.xpGained !== 0 || duplicate.leveledUp) {
  fail("Una captura duplicada volvió a sumar XP.");
}

const mewtwo = captureXpShift(new Set(), "kanto-150");
if (!("counted" in mewtwo) || !mewtwo.counted || mewtwo.xpGained !== 306 || mewtwo.fromLevel !== 1 || mewtwo.toLevel !== 3 || !mewtwo.leveledUp) {
  fail("Mewtwo no subió de nivel 1 a 3 con 306 XP.");
}
const field = captureXpShift(new Set(), "kanto-025");
if (!("counted" in field) || field.xpGained !== xpOf("kanto-025") || KANTO_CATALOG.find((entry) => entry.encounterId === "kanto-025")?.role !== "field") {
  fail("La captura de campo no usó la XP publicada.");
}
const reserved = captureXpShift(new Set(), "kanto-144");
if (!("counted" in reserved) || reserved.xpGained !== 261 || KANTO_CATALOG.find((entry) => entry.encounterId === "kanto-144")?.role !== "reserved") {
  fail("La captura de enclave no usó la XP publicada.");
}

const unknown = captureXpShift(new Set(["kanto-025"]), "kanto-000");
if (!("counted" in unknown) || unknown.counted || unknown.xpGained !== 0 || unknown.after.xp !== 112) {
  fail("Un id ajeno otorgó XP.");
}

const ignored = expeditionXp(new Set(["kanto-025", "kanto-999"]));
if (ignored !== 112) {
  fail("Un id fuera de la expedición alteró la suma.");
}

if (levelForXp(-1, maxXp) !== null || levelForXp(1.5, maxXp) !== null || progressForXp(0, 0) !== null) {
  fail("Una XP inválida o un total vacío se aceptó.");
}

for (let xp = 0; xp <= maxXp; xp += 47) {
  const step = progressForXp(xp, maxXp);
  if (!step || step.percent < 0 || step.percent > 100 || step.xpToNext < 0) {
    fail(`El progreso de ${xp} XP se sale de rango.`);
  }
  if (!step.atCap && step.xpIntoLevel + step.xpToNext !== step.levelSpan) {
    fail(`El tramo de ${xp} XP no cierra.`);
  }
}

const almost = new Set(TRAINER_XP_CATALOG.filter((entry) => entry.nationalId !== 151).map((entry) => entry.encounterId));
const missingMew = assertReady(almost);
if (almost.size !== 55 || missingMew.xp !== maxXp - 270 || missingMew.level !== 9 || missingMew.atCap) {
  fail("55 especies alcanzaron el nivel 10 o no sumaron la XP real.");
}
const withoutMagikarp = new Set(
  TRAINER_XP_CATALOG.filter((entry) => entry.nationalId !== 129).map((entry) => entry.encounterId),
);
const skipCheapest = assertReady(withoutMagikarp);
if (skipCheapest.xp !== maxXp - 40 || skipCheapest.level === TRAINER_LEVEL_CAP) {
  fail("Omitir la especie de menor XP igual llegó al nivel 10.");
}

const complete = assertReady(new Set(TRAINER_XP_CATALOG.map((entry) => entry.encounterId)));
if (
  complete.xp !== maxXp ||
  complete.level !== 10 ||
  complete.highestLevel !== 10 ||
  !complete.atCap ||
  complete.percent !== 100 ||
  complete.xpToNext !== 0 ||
  !isMaxLevel(complete.level)
) {
  fail("Las 56 especies no llegan justo al nivel 10.");
}
if (levelForXp(maxXp - 1, maxXp) !== 9 || levelForXp(maxXp, maxXp) !== 10) {
  fail("El máximo no es exclusivo del total.");
}

const legacyRaw = JSON.stringify({ version: 1, seen: ["kanto-025"], caught: ["kanto-025"] });
const legacy = parseProgress(legacyRaw);
if (!legacy) {
  fail("Un progreso anterior no se leyó.");
}
const legacyReport = assertReady(legacy.caught);
if (legacyReport.xp !== 112 || legacyReport.level !== 2) {
  fail("Las capturas anteriores no cuentan solas.");
}
const legacyDocument: unknown = JSON.parse(serializeProgress(legacy));
if (
  typeof legacyDocument !== "object" ||
  legacyDocument === null ||
  !("version" in legacyDocument) ||
  legacyDocument.version !== 1 ||
  "xp" in legacyDocument ||
  "level" in legacyDocument
) {
  fail("El esquema v1 guardó un contador de XP.");
}

const reloaded = parseProgress(serializeProgress(one));
if (!reloaded || assertReady(reloaded.caught).xp !== 40 || assertReady(reloaded.caught).level !== 2) {
  fail("Recargar no conservó la XP.");
}
const reset = assertReady(emptyProgress().caught);
if (reset.level !== 1 || reset.xp !== 0) {
  fail("Reiniciar no devolvió el nivel 1.");
}

const caughtForTeam = new Set(["kanto-025"]);
const beforeTeam = expeditionXp(caughtForTeam);
addMember([], "kanto-025", caughtForTeam);
evaluateBadges(caughtForTeam, emptyBadgeLedger());
if (expeditionXp(caughtForTeam) !== beforeTeam || beforeTeam !== 112) {
  fail("El equipo o las medallas modificaron la XP.");
}

const player = markCaught(emptyProgress(), "kanto-025");
const playerRaw = serializeProgress(player);
const simulated = qaCatch(new Set<string>(), emptyBadgeLedger(), ["kanto-144", "kanto-150"], "2026-11-14T00:00:00.000Z");
if (serializeProgress(player) !== playerRaw || player.caught.has("kanto-144")) {
  fail("La demostración de medallas escribió el progreso del entrenador.");
}
if (assertReady(player.caught).xp !== 112) {
  fail("La demostración sumó XP real.");
}
if (!simulated.caught.has("kanto-144") || assertReady(simulated.caught).xp === assertReady(player.caught).xp) {
  fail("El fixture de medallas no quedó aislado del entrenador.");
}

const demoSource = readFileSync(new URL("../src/components/expedition/use-badge-demo.ts", import.meta.url), "utf8");
if (
  demoSource.includes("PROGRESS_KEY") ||
  demoSource.includes("markCaught") ||
  demoSource.includes("localStorage") ||
  demoSource.includes("trainer-xp")
) {
  fail("La demostración pública quedó acoplada al progreso o a la XP.");
}

const shortCatalog = TRAINER_XP_CATALOG.slice(0, 55);
if (validateTrainerXpCatalog(shortCatalog).length === 0 || maxExpeditionXp(shortCatalog) !== null) {
  fail("Un catálogo incompleto publicó un total.");
}
const shortReport = assessExpedition(new Set(["kanto-025"]), shortCatalog);
if (shortReport.complete) {
  fail("Un catálogo incompleto se mostró como XP válida.");
}

const zeroed: TrainerXpEntry[] = TRAINER_XP_CATALOG.map((entry) =>
  entry.encounterId === "kanto-025" ? { ...entry, baseExperience: 0 } : entry,
);
if (validateTrainerXpCatalog(zeroed).length === 0 || maxExpeditionXp(zeroed) === 0) {
  fail("Una base_experience en cero reemplazó el total.");
}

const duplicated: TrainerXpEntry[] = TRAINER_XP_CATALOG.map((entry, index) =>
  index === 1 ? { ...entry, nationalId: TRAINER_XP_CATALOG[0]?.nationalId ?? 0, encounterId: TRAINER_XP_CATALOG[0]?.encounterId ?? "" } : entry,
);
if (validateTrainerXpCatalog(duplicated).length === 0) {
  fail("Ids repetidos se aceptaron.");
}

if (validateCosmeticFinishes().length > 0) {
  fail(validateCosmeticFinishes().join(" "));
}
if (finishesUnlockedAt(1).length !== 0 || finishesUnlockedAt(3).map((finish) => finish.id).join() !== "bronze") {
  fail("Los acabados tempranos no respetan el nivel.");
}
const allFinishes = finishesUnlockedAt(10).map((finish) => finish.id);
if (allFinishes.join() !== "bronze,silver,gold,diamond") {
  fail(`El nivel 10 no declara los cuatro acabados: ${allFinishes.join()}.`);
}
if (finishesUnlockedAt(0).length !== 0 || finishesUnlockedAt(11).length !== 0) {
  fail("Un nivel inválido desbloqueó acabados.");
}

async function contrastApi(): Promise<void> {
  const names = new Map(KANTO_CATALOG.map((entry) => [entry.nationalId, entry.speciesName]));
  await Promise.all(
    TRAINER_XP_CATALOG.map(async (entry) => {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${entry.nationalId}`);
      if (!response.ok) {
        fail(`PokéAPI respondió ${response.status} para ${entry.nationalId}.`);
      }
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("base_experience" in body) || !("name" in body)) {
        fail(`La ficha ${entry.nationalId} no trae base_experience.`);
      }
      if (body.base_experience !== entry.baseExperience || body.name !== names.get(entry.nationalId)) {
        fail(
          `${entry.encounterId} publicó ${String(body.base_experience)} (${String(body.name)}) y el catálogo tiene ${entry.baseExperience}.`,
        );
      }
    }),
  );
  console.log(`OK trainer-xp max=${maxXp} levels=${TRAINER_LEVEL_CAP} api=56`);
}

contrastApi().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "La verificación de XP falló.";
  console.error(message);
  process.exit(1);
});
