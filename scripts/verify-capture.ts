import {
  abortCapture,
  applyCapture,
  beginCapture,
  captureDifficulty,
  captureSteps,
  finishCapture,
  resistanceLabel,
  stepCapture,
} from "../src/lib/expedition/capture";
import {
  discoveryState,
  emptyProgress,
  parseProgress,
  serializeProgress,
} from "../src/lib/expedition/progress";
import { captureAccent } from "../src/lib/expedition/capture-accent";
import { perchPose } from "../src/lib/expedition/perch-pose";
import { CAPTURE_CUES } from "../src/lib/expedition/capture-audio";
import { parseSpecies } from "../src/lib/pokeapi/parse";

function fail(message: string): never {
  throw new Error(message);
}

function expectDifficulty(
  rate: number,
  stats: readonly number[],
  expected: number,
): void {
  const difficulty = captureDifficulty(rate, stats);
  if (difficulty !== expected) {
    fail(`Tasa ${rate} y total ${stats.reduce((sum, stat) => sum + stat, 0)} dieron ${difficulty}, no ${expected}.`);
  }
}

const zeros = [0, 0, 0, 0, 0, 0];
const full = [255, 255, 255, 255, 255, 255];

expectDifficulty(255, zeros, 1);
expectDifficulty(0, full, 10);
expectDifficulty(3, full, 10);
expectDifficulty(255, full, 3);
expectDifficulty(0, zeros, 8);
expectDifficulty(255, [20, 10, 55, 15, 20, 80], 1);
expectDifficulty(25, [160, 110, 65, 65, 110, 30], 8);
expectDifficulty(45, [91, 134, 95, 100, 100, 80], 8);
expectDifficulty(3, [106, 110, 90, 154, 90, 130], 9);

if ((captureDifficulty(255, full) ?? 0) >= (captureDifficulty(0, zeros) ?? 0)) {
  fail("El poder máximo invirtió la tasa mínima.");
}

function spread(total: number): number[] {
  const stats = [0, 0, 0, 0, 0, 0];
  let left = total;
  for (let index = 0; index < stats.length; index += 1) {
    const share = Math.min(255, left);
    stats[index] = share;
    left -= share;
  }
  return stats;
}

for (let rate = 0; rate <= 255; rate += 15) {
  let previous = captureDifficulty(rate, zeros);
  for (const total of [0, 180, 400, 680, 1530]) {
    const next = captureDifficulty(rate, spread(total));
    if (previous === null || next === null || next < previous) {
      fail(`Subir el poder bajó la dificultad en tasa ${rate}.`);
    }
    previous = next;
  }
  if (captureDifficulty(rate, [256, 0, 0, 0, 0, 0]) !== null) {
    fail("Una estadística fuera de 0–255 se aceptó.");
  }
  const easier = captureDifficulty(Math.min(255, rate + 15), [100, 100, 100, 100, 100, 100]);
  const harder = captureDifficulty(rate, [100, 100, 100, 100, 100, 100]);
  if (easier === null || harder === null || easier > harder) {
    fail(`Subir la tasa de captura subió la dificultad en ${rate}.`);
  }
}

for (const value of [-1, 256, 1.5, Number.NaN]) {
  if (captureDifficulty(value, zeros) !== null) {
    fail(`La tasa ${value} produjo dificultad.`);
  }
}
if (captureDifficulty(45, [10, 10, 10, 10, 10]) !== null) {
  fail("Cinco estadísticas produjeron dificultad.");
}
if (captureSteps(5) !== 3 || captureSteps(6) !== 4 || captureSteps(1) !== 3 || captureSteps(10) !== 4) {
  fail("Los movimientos no siguen el corte 1–5 y 6–10.");
}
if (captureSteps(0) !== null || captureSteps(11) !== null) {
  fail("Una dificultad fuera de 1–10 tiene movimientos.");
}

const brief = resistanceLabel(1);
const intense = resistanceLabel(10);
if (!brief || !brief.includes("Dificultad 1 de 10") || !brief.includes("3 movimientos")) {
  fail("La dificultad baja no explica la secuencia breve.");
}
if (!intense || !intense.includes("Dificultad 10 de 10") || !intense.includes("4 movimientos")) {
  fail("La dificultad alta no explica la secuencia intensa.");
}
if (resistanceLabel(0) !== null || brief.includes("%") || intense.includes("%")) {
  fail("La descripción inventa una probabilidad.");
}

let easy = beginCapture("kanto-129", 1);
if (!easy || easy.status !== "running" || easy.steps !== 3) {
  fail("La secuencia fácil no arrancó en 3 movimientos.");
}
let beats = 0;
while (easy.status === "running") {
  easy = stepCapture(easy);
  beats += 1;
  if (beats > 4) {
    fail("La secuencia fácil no terminó.");
  }
}
if (beats !== 3 || easy.status !== "done") {
  fail(`La secuencia fácil cerró en ${beats} pasos.`);
}
if (stepCapture(easy) !== easy) {
  fail("Avanzar una captura terminada la reabrió.");
}

let hard = beginCapture("kanto-143", 8);
if (!hard || hard.status !== "running" || hard.steps !== 4) {
  fail("La secuencia alta no arrancó en 4 movimientos.");
}
beats = 0;
while (hard.status === "running") {
  hard = stepCapture(hard);
  beats += 1;
}
if (beats !== 4 || hard.status !== "done") {
  fail(`La secuencia alta cerró en ${beats} pasos.`);
}

const blank = emptyProgress();
const running = beginCapture("kanto-129", 4);
if (!running) {
  fail("No arrancó una captura válida.");
}
const halfway = stepCapture(running);
const aborted = abortCapture(halfway);
if (aborted.status !== "aborted" || applyCapture(blank, aborted) !== blank) {
  fail("Cancelar escribió una captura.");
}
if (applyCapture(blank, halfway) !== blank) {
  fail("Una secuencia a medias escribió una captura.");
}

const skipped = finishCapture(beginCapture("kanto-143", 8) ?? abortCapture({ status: "idle" }));
const caught = applyCapture(blank, skipped);
if (discoveryState(caught, "kanto-143") !== "caught" || !caught.seen.has("kanto-143")) {
  fail("Omitir la secuencia no dejó capturado y visto.");
}
if (applyCapture(caught, skipped) !== caught) {
  fail("Completar dos veces duplicó la captura.");
}

const again = finishCapture(beginCapture("kanto-129", 1) ?? aborted);
const afterCancel = applyCapture(blank, again);
if (discoveryState(afterCancel, "kanto-129") !== "caught") {
  fail("Después de cancelar, otra secuencia no pudo capturar.");
}

if (beginCapture("", 1) !== null || beginCapture("kanto-129", 11) !== null) {
  fail("Arrancó una captura inválida.");
}
const unknown = finishCapture(beginCapture("kanto-000", 1) ?? aborted);
if (applyCapture(blank, unknown) !== blank) {
  fail("Un id ajeno al catálogo se capturó.");
}

const prior = parseProgress(JSON.stringify({ version: 1, seen: ["kanto-151"], caught: [] }));
if (!prior || discoveryState(prior, "kanto-151") !== "seen") {
  fail("El progreso anterior no se leyó.");
}
if (applyCapture(prior, aborted) !== prior) {
  fail("Cancelar alteró un progreso anterior.");
}
const kept = applyCapture(prior, skipped);
if (!kept.seen.has("kanto-151") || !kept.caught.has("kanto-143") || kept.caught.has("kanto-151")) {
  fail("La captura nueva no conservó el visto anterior.");
}
const stored = parseProgress(serializeProgress(kept));
if (!stored || discoveryState(stored, "kanto-143") !== "caught" || discoveryState(stored, "kanto-151") !== "seen") {
  fail("El documento guardado no respeta visto y capturado.");
}

const species = {
  id: 129,
  name: "magikarp",
  capture_rate: 255,
  names: [{ name: "Magikarp", language: { name: "es", url: "https://pokeapi.co/api/v2/language/7/" } }],
  varieties: [{ is_default: true, pokemon: { name: "magikarp", url: "https://pokeapi.co/api/v2/pokemon/129/" } }],
};
if (parseSpecies(species).capture_rate !== 255) {
  fail("La tasa válida no se leyó.");
}
for (const broken of [
  { ...species, capture_rate: undefined },
  { ...species, capture_rate: 256 },
  { ...species, capture_rate: 45.5 },
]) {
  let rejected = false;
  try {
    parseSpecies(broken);
  } catch {
    rejected = true;
  }
  if (!rejected) {
    fail("Una tasa ausente o inválida se aceptó.");
  }
}

if (captureAccent("kanto-129") !== null || captureAccent("kanto-143") !== null) {
  fail("Un encuentro de campo recibió acento de reservado.");
}
const accents = ["kanto-144", "kanto-145", "kanto-146", "kanto-142", "kanto-150", "kanto-151"];
const seenAccents = new Set<string>();
for (const id of accents) {
  const accent = captureAccent(id);
  if (!accent || seenAccents.has(accent)) {
    fail(`El acento de ${id} no es propio.`);
  }
  seenAccents.add(accent);
}
if (CAPTURE_CUES.join(",") !== "throw,absorb,shake,success") {
  fail("Los efectos de captura cambiaron.");
}
if (captureDifficulty(255, [20, 10, 55, 15, 20, 80]) !== 1) {
  fail("El acento alteró la dificultad.");
}

const poseBase = {
  caught: false,
  status: "running" as const,
  reel: "throw" as const,
  reduced: false,
  step: 0,
};
for (const id of accents) {
  if (captureAccent(id) === null) {
    fail(`El enclave ${id} perdió su acento.`);
  }
  if (perchPose(poseBase) !== "shown") {
    fail("El sprite del enclave se ocultó durante el lanzamiento.");
  }
  if (perchPose({ ...poseBase, reel: "absorb" }) !== "absorb") {
    fail("La absorción no mueve el sprite del escenario.");
  }
  if (perchPose({ ...poseBase, reel: "drop" }) !== "hidden") {
    fail("El sprite sigue en el altar al caer la bola.");
  }
  if (perchPose({ ...poseBase, reel: "resist", step: 2 }) !== "hidden") {
    fail("El sprite sigue flotando durante un movimiento.");
  }
  if (perchPose({ ...poseBase, status: "aborted", reel: "still" }) !== "shown") {
    fail("Cancelar no devolvió el sprite a su lugar.");
  }
  if (perchPose({ ...poseBase, status: "done", reel: "flash" }) !== "hidden") {
    fail("Omitir o completar dejó el sprite visible.");
  }
  if (perchPose({ ...poseBase, caught: true, status: "idle", reel: "still" }) !== "hidden") {
    fail("Un capturado reingresa como salvaje.");
  }
  if (perchPose({ ...poseBase, reduced: true, reel: "still", step: 0 }) !== "shown") {
    fail("El movimiento reducido ocultó el sprite antes del primer paso.");
  }
  if (perchPose({ ...poseBase, reduced: true, reel: "still", step: 1 }) !== "hidden") {
    fail("El movimiento reducido dejó el sprite durante la resistencia.");
  }
}

console.log("OK capture difficulty=1..10 steps=3/4 prior=kanto-151");
