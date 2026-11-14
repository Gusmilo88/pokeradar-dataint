import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { BADGE_CASE_ASSET, BADGES } from "../src/lib/badges/badges-data";
import {
  allCaptured,
  badgeSummary,
  capturedCount,
  evaluateBadge,
  evaluateBadges,
  progressPercent,
} from "../src/lib/badges/evaluate";
import {
  acknowledgeBadge,
  adoptHeldUnlocks,
  emptyBadgeLedger,
  markCollectionCelebrated,
  parseBadgeLedger,
  serializeBadgeLedger,
  witnessUnlocks,
} from "../src/lib/badges/ledger";
import { allBadgeSpecies, badgeQaEnabled, badgeQaRequested, missingSpecies, qaCatch } from "../src/lib/badges/qa";

function fail(message: string): never {
  throw new Error(message);
}

const EXPECTED = ["roca", "cascada", "trueno", "arcoiris", "alma", "pantano", "volcan", "tierra"] as const;
const ASSETS = EXPECTED.map((id) => `/assets/medallas/${id}.webp`);

if (BADGES.length !== 8) {
  fail(`Hay ${BADGES.length} medallas.`);
}
if (BADGES.map((badge) => badge.id).join() !== EXPECTED.join()) {
  fail("El orden o los ids de la vitrina cambiaron.");
}
if (BADGE_CASE_ASSET !== "/assets/medallas/vitrina.webp") {
  fail("La vitrina opcional no apunta al asset previsto.");
}

const catalog = new Set(KANTO_CATALOG.map((entry) => entry.encounterId));
for (const badge of BADGES) {
  if (badge.slug !== badge.id || badge.visualClass !== `badge-tone-${badge.id}`) {
    fail(`${badge.id} no conserva slug y clase.`);
  }
  if (badge.assetPath !== `/assets/medallas/${badge.id}.webp`) {
    fail(`${badge.id} no apunta a su WebP.`);
  }
  if (badge.rule.kind !== "allCaptured" || badge.rule.speciesIds.length === 0) {
    fail(`${badge.id} no exige el conjunto completo.`);
  }
  if (badge.species.map((item) => item.encounterId).join() !== badge.rule.speciesIds.join()) {
    fail(`${badge.id} separó la lista visible de la regla.`);
  }
  const seen = new Set<string>();
  for (const id of badge.rule.speciesIds) {
    if (!catalog.has(id) || seen.has(id)) {
      fail(`${badge.id} tiene una especie inválida: ${id}`);
    }
    seen.add(id);
    const entry = KANTO_CATALOG.find((item) => item.encounterId === id);
    if (!entry || badge.species.find((item) => item.encounterId === id)?.label !== entry.speciesName[0]?.toUpperCase() + entry.speciesName.slice(1)) {
      fail(`${badge.id} muestra un nombre que no sale del catálogo.`);
    }
  }
}
if (ASSETS.join() !== BADGES.map((badge) => badge.assetPath).join()) {
  fail("Las rutas de arte no coinciden con las ocho medallas.");
}
for (const id of EXPECTED) {
  const file = join(process.cwd(), "public", "assets", "medallas", `${id}.webp`);
  if (!existsSync(file)) {
    fail(`Falta el archivo de ${id}.`);
  }
  const bytes = readFileSync(file);
  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    fail(`${id}.webp no es un WebP.`);
  }
}

if (progressPercent(0, 5) !== 0 || progressPercent(2, 5) !== 40 || progressPercent(5, 5) !== 100) {
  fail("El porcentaje de un conjunto no cierra.");
}
if (progressPercent(1, 8) !== 13 || progressPercent(0, 0) !== 0) {
  fail("El porcentaje total no cierra.");
}
if (allCaptured(new Set(), []) || allCaptured(new Set(["kanto-025"]), ["kanto-025", "kanto-025"]) !== true) {
  fail("allCaptured no trata vacío ni repetidos.");
}
if (capturedCount(new Set(["kanto-025"]), ["kanto-025", "kanto-100"]) !== 1) {
  fail("capturedCount no contó el parcial.");
}

const roca = BADGES[0];
const trueno = BADGES[2];
if (!roca || !trueno) {
  fail("Faltan Roca o Trueno.");
}

const none = evaluateBadges(new Set(), emptyBadgeLedger());
const blankSummary = badgeSummary(none);
if (blankSummary.earned !== 0 || blankSummary.total !== 8 || blankSummary.percent !== 0) {
  fail("La vitrina vacía no arranca en 0/8.");
}
if (none.some((badge) => badge.unlocked || badge.presentation !== "locked" || badge.unlockedAt !== null)) {
  fail("Sin capturas hay una medalla abierta.");
}
const rocaBlank = none.find((badge) => badge.id === "roca");
if (!rocaBlank || rocaBlank.captured !== 0 || rocaBlank.missing.length !== rocaBlank.total) {
  fail("Roca bloqueada no lista lo que falta.");
}

const partialCaught = new Set(["kanto-074", "kanto-076"]);
const partial = evaluateBadge(roca, partialCaught, emptyBadgeLedger());
if (partial.unlocked || partial.captured !== 2 || partial.progressPercent !== 50 || partial.missing.length !== 2) {
  fail("El parcial de Roca no quedó en 2/4.");
}

const rocaIds = roca.rule.speciesIds;
if (!allCaptured(new Set(rocaIds), rocaIds)) {
  fail("Roca completa no cumple allCaptured.");
}

const now = "2026-11-14T21:00:00.000Z";
const later = "2026-12-01T00:00:00.000Z";
const held = adoptHeldUnlocks(emptyBadgeLedger(), new Set(rocaIds));
if (held.records.roca?.unlockedAt !== null || held.records.roca?.celebrated !== true) {
  fail("Una medalla ya obtenida inventó fecha o pidió celebración.");
}
if (evaluateBadge(roca, new Set(rocaIds), held).presentation !== "earned") {
  fail("Lo ya obtenido no quedó conseguido.");
}
const witnessed = witnessUnlocks(emptyBadgeLedger(), new Set(), new Set(rocaIds), now);
const again = witnessUnlocks(witnessed.ledger, new Set(rocaIds), new Set(rocaIds), later);
if (witnessed.medals.join() !== "roca" || witnessed.collection) {
  fail("La transición de Roca no quedó sola.");
}
if (again.ledger !== witnessed.ledger || witnessed.ledger.records.roca?.unlockedAt !== now || witnessed.ledger.records.roca.celebrated !== false) {
  fail("La fecha de Roca no quedó fija.");
}
if (witnessed.ledger.records.trueno) {
  fail("Trueno se anotó sin su conjunto.");
}

const fresh = evaluateBadge(roca, new Set(rocaIds), witnessed.ledger);
if (!fresh.unlocked || fresh.presentation !== "fresh" || fresh.unlockedAt !== now || fresh.missing.length !== 0) {
  fail("Roca conseguida no entra en celebración.");
}

const seen = acknowledgeBadge(witnessed.ledger, "roca");
if (seen === witnessed.ledger || evaluateBadge(roca, new Set(rocaIds), seen).presentation !== "earned") {
  fail("Cerrar la celebración no pasó la medalla a conseguida.");
}
if (acknowledgeBadge(seen, "roca") !== seen) {
  fail("Confirmar dos veces duplicó el registro.");
}
if (acknowledgeBadge(emptyBadgeLedger(), "roca") !== emptyBadgeLedger()) {
  fail("Se confirmó una medalla que no está ganada.");
}
const reloaded = adoptHeldUnlocks(witnessed.ledger, new Set(rocaIds));
if (reloaded.records.roca?.celebrated !== true || reloaded.records.roca.unlockedAt !== now) {
  fail("Recargar repitió la celebración o cambió la fecha.");
}

const dropped = evaluateBadge(roca, new Set(["kanto-074"]), seen);
if (dropped.unlocked || dropped.presentation !== "locked" || dropped.unlockedAt !== now) {
  fail("Perder una especie no volvió a bloquear, o borró la fecha guardada.");
}

const cascada = BADGES[1];
if (!cascada) {
  fail("Falta Cascada.");
}
const almost = new Set([...rocaIds.slice(0, -1), ...cascada.rule.speciesIds.slice(0, -1)]);
const bothNow = new Set([...rocaIds, ...cascada.rule.speciesIds]);
const pair = witnessUnlocks(emptyBadgeLedger(), almost, bothNow, now);
if (pair.medals.join() !== "roca,cascada" || pair.collection) {
  fail("Dos medallas simultáneas no salieron en orden.");
}

const full = new Set(BADGES.flatMap((badge) => [...badge.rule.speciesIds]));
const adoptedFull = adoptHeldUnlocks(emptyBadgeLedger(), full);
if (!adoptedFull.collectionCelebrated || Object.values(adoptedFull.records).some((record) => record.unlockedAt !== null || !record.celebrated)) {
  fail("8/8 heredado no quedó cerrado y sin fecha inventada.");
}
const finale = witnessUnlocks(emptyBadgeLedger(), new Set(), full, now);
if (finale.medals.length !== 8 || !finale.collection || finale.ledger.collectionCelebrated) {
  fail("Completar las ocho no armó la celebración final.");
}
const afterFinale = markCollectionCelebrated(acknowledgeBadge(finale.ledger, "tierra"));
if (!afterFinale.collectionCelebrated || witnessUnlocks(afterFinale, new Set(), full, later).collection) {
  fail("La vitrina completa se volvió a ofrecer.");
}
const fullView = evaluateBadges(full, finale.ledger);
if (badgeSummary(fullView).percent !== 100 || fullView.some((badge) => badge.presentation !== "fresh")) {
  fail("8/8 no quedó en celebración.");
}

const roundTrip = parseBadgeLedger(serializeBadgeLedger(seen));
if (!roundTrip || roundTrip.records.roca?.unlockedAt !== now || roundTrip.records.roca.acknowledged !== true || roundTrip.records.roca.celebrated !== true) {
  fail("La bitácora de medallas no sobrevivió el esquema.");
}
const quiet = parseBadgeLedger(serializeBadgeLedger(held));
if (!quiet || quiet.records.roca?.unlockedAt !== null) {
  fail("Una fecha desconocida no sobrevivió como null.");
}
if (parseBadgeLedger("no es json") !== null) {
  fail("Un texto roto se aceptó.");
}
if (parseBadgeLedger(JSON.stringify({ version: 2, records: {} })) !== null) {
  fail("Otra versión del esquema se aceptó.");
}
if (parseBadgeLedger(JSON.stringify({ version: 1, records: { Roca: { unlockedAt: now, acknowledged: false } } })) !== null) {
  fail("Un id inválido se aceptó.");
}
if (parseBadgeLedger(JSON.stringify({ version: 1, records: { roca: { unlockedAt: "", acknowledged: false } } })) !== null) {
  fail("Una fecha vacía se aceptó.");
}
if (parseBadgeLedger(JSON.stringify({ version: 1, records: { roca: { unlockedAt: now, acknowledged: "si" } } })) !== null) {
  fail("Un confirmado mal escrito se aceptó.");
}

const kept = parseBadgeLedger(JSON.stringify({
  version: 1,
  records: { futura: { unlockedAt: now, acknowledged: true }, roca: { unlockedAt: now, acknowledged: false } },
}));
if (!kept || kept.records.futura?.unlockedAt !== now) {
  fail("Una medalla todavía no definida se perdió al leer.");
}
if (!serializeBadgeLedger(kept).includes("\"futura\"")) {
  fail("Una medalla extra no se volvió a guardar.");
}

if (!badgeQaRequested("?qaBadges=1") || !badgeQaRequested("qaBadges=1&otro=2")) {
  fail("El modo prueba no reconoce ?qaBadges=1.");
}
if (badgeQaRequested("") || badgeQaRequested("?qaBadges=0") || badgeQaRequested("?qaBadges=1x")) {
  fail("El modo prueba se activó con un query inválido.");
}
if (badgeQaEnabled("?qaBadges=1") !== (process.env.NODE_ENV === "development")) {
  fail("El modo prueba no respeta el entorno.");
}
if (process.env.NODE_ENV === "production" && badgeQaEnabled("?qaBadges=1")) {
  fail("El modo prueba quedó disponible en producción.");
}

const rocaMissing = rocaIds[rocaIds.length - 1];
if (cascada.rule.kind !== "allCaptured" || !rocaMissing) {
  fail("No hay un par de medallas para la prueba compartida.");
}
const qaCascadaIds = cascada.rule.speciesIds;
const qaCascadaMissing = qaCascadaIds[qaCascadaIds.length - 1];
if (!qaCascadaMissing) {
  fail("Cascada no tiene especies.");
}
const qaAlmost = new Set<string>([...rocaIds.slice(0, -1), ...qaCascadaIds.slice(0, -1)]);
const blankLedger = emptyBadgeLedger();
const qaPair = qaCatch(qaAlmost, blankLedger, [rocaMissing, qaCascadaMissing], now);
if (qaPair.result.medals.join() !== "roca,cascada" || qaPair.result.collection) {
  fail("Completar dos conjuntos a la vez no usó el motor real.");
}
if (blankLedger.records.roca || blankLedger.records.cascada) {
  fail("La prueba escribió sobre la bitácora de entrada.");
}
const onlyRoca = qaCatch(new Set(rocaIds.slice(0, -1)), emptyBadgeLedger(), missingSpecies("roca", new Set(rocaIds.slice(0, -1))), now);
if (onlyRoca.result.medals.join() !== "roca" || onlyRoca.caught.size !== rocaIds.length) {
  fail("Completar una medalla no cerró solo su conjunto.");
}

let trialLedger = emptyBadgeLedger();
let trialCaught = new Set<string>();
const allIds = allBadgeSpecies();
const firstSweep = qaCatch(trialCaught, trialLedger, allIds, now);
trialCaught = new Set(firstSweep.caught);
trialLedger = firstSweep.result.ledger;
if (firstSweep.result.medals.length !== 8 || !firstSweep.result.collection || trialLedger.collectionCelebrated) {
  fail("Completar las ocho en prueba no dejó la celebración final pendiente.");
}
for (const id of firstSweep.result.medals) {
  trialLedger = acknowledgeBadge(trialLedger, id);
}
trialLedger = markCollectionCelebrated(trialLedger);
const secondSweep = qaCatch(trialCaught, trialLedger, allIds, later);
if (secondSweep.caught !== trialCaught || secondSweep.result.medals.length !== 0 || secondSweep.result.collection) {
  fail("La celebración de 8/8 se ofreció dos veces en la misma prueba.");
}

console.log("verify-badges ok");
