import { readFileSync } from "node:fs";

import { playLevelFanfare } from "../src/lib/expedition/capture-audio";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import {
  describeLevelRise,
  dismissLevelCeremony,
  emptyLevelSession,
  noteCaught,
  skipLevelCeremonies,
  type LevelCeremonyPlan,
  type LevelCeremonySession,
} from "../src/lib/expedition/level-ceremony";
import { assessExpedition } from "../src/lib/expedition/trainer-xp";
import { TRAINER_XP_CATALOG } from "../src/lib/expedition/trainer-xp-catalog";
import { rankForLevel } from "../src/lib/expedition/trainer-rewards";

function fail(message: string): never {
  throw new Error(message);
}

function levelOf(ids: readonly string[]): number {
  const report = assessExpedition(new Set(ids));
  if (!report.complete) {
    fail(report.issues.join(" "));
  }
  return report.progress.level;
}

function beforeLevel(target: number): { ids: string[]; nextId: string } {
  const ids: string[] = [];
  for (const entry of TRAINER_XP_CATALOG) {
    const trial = [...ids, entry.encounterId];
    if (levelOf(trial) >= target) {
      return { ids, nextId: entry.encounterId };
    }
    ids.push(entry.encounterId);
  }
  fail(`Ninguna captura alcanza el nivel ${target}.`);
}

function rewardIds(plan: LevelCeremonyPlan): string {
  return plan.rewards.map((finish) => finish.id).join(",");
}

function adopt(ids: readonly string[]): LevelCeremonySession {
  return noteCaught(emptyLevelSession(), new Set(ids));
}

playLevelFanfare("level");
playLevelFanfare("reward");

const quiet = adopt([]);
if (quiet.queue.length !== 0 || levelOf([]) !== 1) {
  fail("La partida vacía celebró un nivel.");
}

const held = beforeLevel(8).ids;
if (levelOf(held) !== 7) {
  fail(`La base del nivel 8 quedó en ${levelOf(held)}.`);
}
if (adopt(held).queue.length !== 0 || adopt(KANTO_CATALOG.map((entry) => entry.encounterId)).queue.length !== 0) {
  fail("Cargar una partida avanzada celebró niveles viejos.");
}

const first = noteCaught(quiet, new Set(["kanto-052"]));
const firstPlan = first.queue[0];
if (!firstPlan || first.queue.length !== 1 || firstPlan.fromLevel !== 1 || firstPlan.toLevel !== 2 || firstPlan.rewards.length !== 0) {
  fail("La primera captura no subió un solo nivel sin recompensa.");
}
if (firstPlan.rank !== rankForLevel(2) || firstPlan.intensity !== "rise" || firstPlan.specimenId !== "kanto-052") {
  fail("La subida simple no conservó rango, intensidad o especie.");
}
if (noteCaught(first, new Set(["kanto-052"])) !== first) {
  fail("Repetir el mismo conjunto volvió a celebrar.");
}

const still = noteCaught(first, new Set(["kanto-052", "kanto-133"]));
if (still.queue.length !== 1 || levelOf(["kanto-052", "kanto-133"]) !== 2) {
  fail("Una captura dentro del mismo nivel abrió otra ceremonia.");
}

const special = noteCaught(quiet, new Set(["kanto-150"]));
const specialPlan = special.queue[0];
if (
  !specialPlan
  || special.queue.length !== 1
  || specialPlan.fromLevel !== 1
  || specialPlan.toLevel !== 3
  || specialPlan.reached.join() !== "2,3"
  || rewardIds(specialPlan) !== "bronze"
  || specialPlan.specimenId !== "kanto-150"
  || specialPlan.intensity !== "reward"
) {
  fail("Mewtwo no consolidó el salto 1→3 con Bronce.");
}

const bronzeCut = beforeLevel(3);
const bronze = noteCaught(adopt(bronzeCut.ids), new Set([...bronzeCut.ids, bronzeCut.nextId]));
const bronzePlan = bronze.queue[0];
if (!bronzePlan || bronze.queue.length !== 1 || rewardIds(bronzePlan) !== "bronze" || bronzePlan.toLevel < 3 || bronzePlan.toLevel >= 5) {
  fail("El desbloqueo de Bronce no quedó en una sola ceremonia.");
}

const silverCut = beforeLevel(5);
const silver = noteCaught(adopt(silverCut.ids), new Set([...silverCut.ids, silverCut.nextId]));
const silverPlan = silver.queue[0];
if (!silverPlan || rewardIds(silverPlan) !== "silver" || silverPlan.fromLevel !== 4 || silverPlan.toLevel !== 5 || silverPlan.intensity !== "reward") {
  fail("Plata no se desbloqueó al pasar de 4 a 5.");
}

const goldCut = beforeLevel(8);
const gold = noteCaught(adopt(goldCut.ids), new Set([...goldCut.ids, goldCut.nextId]));
const goldPlan = gold.queue[0];
if (!goldPlan || rewardIds(goldPlan) !== "gold" || goldPlan.fromLevel !== 7 || goldPlan.toLevel !== 8 || goldPlan.intensity !== "gold") {
  fail("Oro no se desbloqueó al pasar de 7 a 8.");
}

const diamondCut = beforeLevel(10);
const diamond = noteCaught(adopt(diamondCut.ids), new Set([...diamondCut.ids, diamondCut.nextId]));
const diamondPlan = diamond.queue[0];
if (
  !diamondPlan
  || rewardIds(diamondPlan) !== "diamond"
  || diamondPlan.fromLevel !== 9
  || diamondPlan.toLevel !== 10
  || diamondPlan.rank !== "Cronista"
  || diamondPlan.intensity !== "diamond"
  || diamondPlan.phrase !== "La expedición alcanza su crónica."
) {
  fail("Diamante no se desbloqueó al completar el nivel 10.");
}

const bridge = noteCaught(adopt(goldCut.ids), new Set(TRAINER_XP_CATALOG.map((entry) => entry.encounterId)));
const bridgePlan = bridge.queue[0];
if (
  !bridgePlan
  || bridge.queue.length !== 1
  || bridgePlan.fromLevel !== 7
  || bridgePlan.toLevel !== 10
  || rewardIds(bridgePlan) !== "gold,diamond"
  || bridgePlan.reached.join() !== "8,9,10"
) {
  fail("El salto hasta el nivel 10 omitió Oro o partió la ceremonia.");
}

const wide = describeLevelRise(1, 10, "kanto-150");
if (!wide || wide.rewards.map((finish) => finish.id).join() !== "bronze,silver,gold,diamond" || wide.reached.join() !== "2,3,4,5,6,7,8,9,10") {
  fail("Un salto largo omitió niveles o recompensas intermedias.");
}
if (describeLevelRise(2, 2, null) !== null || describeLevelRise(0, 4, null) !== null) {
  fail("Un nivel inválido armó una ceremonia.");
}

let queued = first;
const secondCut = beforeLevel(4);
queued = noteCaught(adopt(secondCut.ids), new Set([...secondCut.ids, secondCut.nextId]));
const earlier = noteCaught(quiet, new Set(["kanto-052"]));
const laterIds = ["kanto-052", "kanto-133", "kanto-132"];
if (levelOf(laterIds) <= 2) {
  fail("La tercera captura de prueba no sube de nivel.");
}
const paired = noteCaught(earlier, new Set(laterIds));
if (paired.queue.length !== 2) {
  fail("Dos subidas no quedaron encoladas.");
}
const dismissed = dismissLevelCeremony(paired);
if (dismissed.queue.length !== 1 || dismissed.queue[0]?.id === paired.queue[0]?.id) {
  fail("Cerrar no avanzó a la ceremonia siguiente.");
}
if (skipLevelCeremonies(dismissed).queue.length !== 0) {
  fail("Omitir no vació la cola de nivel.");
}
if (queued.queue.length !== 1) {
  fail("La subida aislada al nivel 4 no fue una sola ceremonia.");
}

const reset = noteCaught(special, new Set());
if (reset.queue.length !== 0) {
  fail("Reiniciar dejó una celebración pendiente.");
}
const again = noteCaught(reset, new Set(["kanto-052"]));
if (again.queue.length !== 1 || again.queue[0]?.fromLevel !== 1) {
  fail("Después del reinicio una captura nueva no celebró.");
}

const ignored = noteCaught(quiet, new Set(["ajena"]));
if (ignored.queue.length !== 0 || levelOf([]) !== 1) {
  fail("Un id ajeno al catálogo celebró.");
}

const lib = readFileSync(new URL("../src/lib/expedition/level-ceremony.ts", import.meta.url), "utf8");
const hook = readFileSync(new URL("../src/components/expedition/use-level-ceremony.ts", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/expedition/level-ceremony.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/components/expedition/level-ceremony.css", import.meta.url), "utf8");
const audio = readFileSync(new URL("../src/lib/expedition/capture-audio.ts", import.meta.url), "utf8");
const screen = readFileSync(new URL("../src/components/expedition/expedition-screen.tsx", import.meta.url), "utf8");
const demo = readFileSync(new URL("../src/components/expedition/use-badge-demo.ts", import.meta.url), "utf8");
const xp = readFileSync(new URL("../src/lib/expedition/trainer-xp.ts", import.meta.url), "utf8");

if (lib.includes("localStorage") || lib.includes("equipFinish") || hook.includes("localStorage")) {
  fail("La ceremonia guardó un contador o equipó un acabado.");
}
if (!hook.includes("if (!ready)") || !hook.includes("if (next === sessionRef.current)") || !hook.includes("noteCaught")) {
  fail("El gancho puede celebrar la partida cargada o repetirla en el mismo render.");
}
if (!view.includes("Disponible para equipar en tu perfil.") || !view.includes("Cerrar") || !view.includes("Escape")) {
  fail("Faltan el aviso de perfil, Cerrar o Escape.");
}
if (!view.includes("prefersReducedMotion") || !view.includes('data-motion={reduced ? "reduce" : "full"}')) {
  fail("La ceremonia no distingue reduced motion.");
}
if (!view.includes("capture-stage") || !view.includes("data-finish={finish.id}") || !view.includes("tcg-card")) {
  fail("La ceremonia no espera a la captura o no reutiliza la carta.");
}
if (view.includes("equipFinish") || view.includes("useFinishes")) {
  fail("La ceremonia equipa un acabado.");
}
if (!css.includes("prefers-reduced-motion: reduce") || !css.includes("animation: none") || !css.includes("overflow-x: hidden")) {
  fail("La presentación no apaga el movimiento o permite desborde horizontal.");
}

const fanfare = audio.slice(audio.indexOf("export function playLevelFanfare"));
const fanfareEnd = fanfare.indexOf("export function playCaptureCue");
const fanfareBody = fanfareEnd === -1 ? fanfare : fanfare.slice(0, fanfareEnd);
if (
  !fanfareBody.includes("readCaptureAudio()")
  || fanfareBody.indexOf("readCaptureAudio()") > fanfareBody.indexOf("audioContext()")
  || !fanfareBody.includes("active?.stop()")
  || !fanfareBody.includes('kind === "reward"')
) {
  fail("La fanfarria de nivel no respeta el silencio o suena encima de otro efecto.");
}
if (!audio.includes("export function playLevelFanfare")) {
  fail("Falta la fanfarria de nivel.");
}

const levelSlot = screen.indexOf("levels.ceremony ? (");
const medalSlot = screen.indexOf(": badgeCeremony ? (");
if (levelSlot === -1 || medalSlot === -1 || levelSlot > medalSlot || !screen.includes("useLevelCeremonies(progress.caught, hydrated)")) {
  fail("La cola no muestra el nivel antes que la medalla.");
}
if (screen.includes("{badgeCeremony ? (")) {
  fail("La medalla puede montarse junto al nivel.");
}
if (demo.includes("useLevelCeremonies") || demo.includes("noteCaught") || demo.includes("playLevelFanfare")) {
  fail("La demostración de medallas genera celebraciones de nivel.");
}
if (xp.includes("level-ceremony") || xp.includes("playLevelFanfare")) {
  fail("El motor de XP quedó acoplado a la ceremonia.");
}

console.log("OK level ceremony rise reward jump queue silence");
