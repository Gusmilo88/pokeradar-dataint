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
  emptyBadgeLedger,
  parseBadgeLedger,
  serializeBadgeLedger,
  stampUnlocks,
} from "../src/lib/badges/ledger";

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
const stamped = stampUnlocks(emptyBadgeLedger(), new Set(rocaIds), now);
const again = stampUnlocks(stamped, new Set(rocaIds), "2026-12-01T00:00:00.000Z");
if (again !== stamped || stamped.records.roca?.unlockedAt !== now || stamped.records.roca.acknowledged !== false) {
  fail("La fecha de Roca no quedó fija.");
}
if (stamped.records.trueno) {
  fail("Trueno se anotó sin su conjunto.");
}

const earned = evaluateBadge(roca, new Set(rocaIds), stamped);
if (!earned.unlocked || earned.presentation !== "fresh" || earned.unlockedAt !== now || earned.missing.length !== 0) {
  fail("Roca conseguida no entra en celebración.");
}

const seen = acknowledgeBadge(stamped, "roca");
if (seen === stamped || evaluateBadge(roca, new Set(rocaIds), seen).presentation !== "earned") {
  fail("Cerrar el detalle no pasó la medalla a conseguida.");
}
if (acknowledgeBadge(seen, "roca") !== seen) {
  fail("Confirmar dos veces duplicó el registro.");
}
if (acknowledgeBadge(emptyBadgeLedger(), "roca") !== emptyBadgeLedger()) {
  fail("Se confirmó una medalla que no está ganada.");
}

const dropped = evaluateBadge(roca, new Set(["kanto-074"]), seen);
if (dropped.unlocked || dropped.presentation !== "locked" || dropped.unlockedAt !== now) {
  fail("Perder una especie no volvió a bloquear, o borró la fecha guardada.");
}

const full = new Set(BADGES.flatMap((badge) => [...badge.rule.speciesIds]));
const allStamped = stampUnlocks(emptyBadgeLedger(), full, now);
if (Object.keys(allStamped.records).length !== 8) {
  fail("El conjunto completo no abrió las ocho.");
}
const fullView = evaluateBadges(full, allStamped);
if (badgeSummary(fullView).percent !== 100 || fullView.some((badge) => badge.presentation !== "fresh")) {
  fail("8/8 no quedó en celebración.");
}

const roundTrip = parseBadgeLedger(serializeBadgeLedger(seen));
if (!roundTrip || roundTrip.records.roca?.unlockedAt !== now || roundTrip.records.roca.acknowledged !== true) {
  fail("La bitácora de medallas no sobrevivió el esquema.");
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

console.log("verify-badges ok");
