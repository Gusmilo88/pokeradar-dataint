import { readFileSync } from "node:fs";
import { join } from "node:path";

import { badgeSummary, evaluateBadges } from "../src/lib/badges/evaluate";
import { adoptHeldUnlocks, emptyBadgeLedger } from "../src/lib/badges/ledger";
import {
  completeExpeditionDemo,
  dismissExpeditionCeremony,
  enterExpeditionDemo,
  equipExpeditionDemo,
  exitExpeditionDemo,
  inactiveExpeditionDemo,
  resetExpeditionDemo,
  type ExpeditionDemoSession,
} from "../src/lib/expedition/expedition-demo";
import { EXPEDITION_SIZE, KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { assessExpedition } from "../src/lib/expedition/trainer-xp";

function fail(message: string): never {
  throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function reportOf(session: ExpeditionDemoSession) {
  const report = assessExpedition(session.caught);
  if (!report.complete) {
    fail(report.issues.join(" "));
  }
  return report.progress;
}

const idle = inactiveExpeditionDemo();
if (idle.active || completeExpeditionDemo(idle) !== idle) {
  fail("Completar fuera de la demostración cambió la sesión.");
}

const opened = enterExpeditionDemo(idle);
if (!opened.active || opened.caught.size !== 0 || opened.ceremony || opened.equipped !== "base") {
  fail("Entrar no dejó una expedición vacía en memoria.");
}
if (enterExpeditionDemo(opened) !== opened) {
  fail("Entrar dos veces reinició la demostración.");
}

const full = completeExpeditionDemo(opened);
const progress = reportOf(full);
if (
  full.caught.size !== EXPEDITION_SIZE ||
  full.caught.size !== KANTO_CATALOG.length ||
  progress.xp !== 7894 ||
  progress.level !== 10 ||
  !progress.atCap
) {
  fail(`Las 56 capturas dieron ${full.caught.size} especies, ${progress.xp} XP y nivel ${progress.level}.`);
}
if (
  !full.ceremony ||
  full.ceremony.fromLevel !== 1 ||
  full.ceremony.toLevel !== 10 ||
  full.ceremony.phrase !== "¡Subiste de nivel!" ||
  full.ceremony.rewards.map((finish) => finish.id).join(",") !== "bronze,silver,gold,diamond"
) {
  fail("La celebración no consolidó el ascenso hasta Diamante.");
}
if (completeExpeditionDemo(full) !== full) {
  fail("Volver a completar repitió la celebración.");
}

const quiet = dismissExpeditionCeremony(full);
if (quiet.ceremony || completeExpeditionDemo(quiet) !== quiet || !quiet.celebrated) {
  fail("Cerrar la celebración permitió repetirla.");
}

const diamond = equipExpeditionDemo(quiet, "diamond");
if (diamond.equipped !== "diamond" || diamond.caught !== quiet.caught) {
  fail("Diamante no quedó equipado solo en la demostración.");
}
if (equipExpeditionDemo(opened, "diamond") !== opened) {
  fail("Diamante se equipó antes del nivel 10.");
}

const cleared = resetExpeditionDemo(diamond);
if (!cleared.active || cleared.caught.size !== 0 || cleared.ceremony || cleared.celebrated || cleared.equipped !== "base") {
  fail("Reiniciar no descartó la expedición simulada.");
}
const again = completeExpeditionDemo(cleared);
if (!again.ceremony || again.ceremony.toLevel !== 10 || reportOf(again).xp !== 7894) {
  fail("Una demostración reiniciada no volvió a calcular el nivel 10.");
}

const partial: ExpeditionDemoSession = {
  active: true,
  caught: new Set(["kanto-052"]),
  equipped: "base",
  ceremony: null,
  celebrated: false,
};
const resumed = completeExpeditionDemo(partial);
const resumedProgress = reportOf(resumed);
if (
  resumed.caught.size !== 56 ||
  resumedProgress.level !== 10 ||
  resumedProgress.xp !== 7894 ||
  resumed.ceremony?.fromLevel !== 2 ||
  resumed.ceremony.toLevel !== 10
) {
  fail("Completar desde una partida parcial no usó el motor real.");
}

const left = exitExpeditionDemo();
if (left.active || left.caught.size !== 0 || left.ceremony) {
  fail("Salir conservó capturas simuladas.");
}

const medals = evaluateBadges(full.caught, adoptHeldUnlocks(emptyBadgeLedger(), full.caught));
const medalSummary = badgeSummary(medals);
if (medalSummary.earned !== medalSummary.total || medals.some((badge) => badge.presentation === "fresh")) {
  fail("Las medallas de la expedición completa armaron una cola de ceremonias.");
}

const demoSource = read("src/lib/expedition/expedition-demo.ts");
const hookSource = read("src/components/expedition/use-expedition-demo.ts");
const dexSource = read("src/components/expedition/pokedex-view.tsx");
const screenSource = read("src/components/expedition/expedition-screen.tsx");
for (const source of [demoSource, hookSource]) {
  if (source.includes("localStorage") || source.includes("sessionStorage") || source.includes("setItem")) {
    fail("La demostración escribe almacenamiento.");
  }
}
if (!dexSource.includes("useFinishes(realLevel)") || !dexSource.includes("Probar expedición completa")) {
  fail("La Pokédex no separa el acabado real de la demostración.");
}
if (dexSource.includes("finishes.equip") && !dexSource.includes("demo.active ? demo.equip : finishes.equip")) {
  fail("El perfil de demostración puede guardar el acabado real.");
}
if (
  !screenSource.includes("useLevelCeremonies(progress.caught, hydrated)") ||
  !screenSource.includes("useBadges(progress.caught)") ||
  screenSource.includes("useBadges(expeditionDemo") ||
  screenSource.includes("useLevelCeremonies(expeditionDemo") ||
  screenSource.includes("useFinishes(")
) {
  fail("La pantalla mezcló la demostración con el progreso real.");
}
if (!screenSource.includes("expeditionDemo.ceremony") || !screenSource.includes("adoptHeldUnlocks")) {
  fail("Falta la celebración en memoria o el evaluador real de medallas.");
}

console.log("OK expedition demo 56 7894 level 10 isolated");
