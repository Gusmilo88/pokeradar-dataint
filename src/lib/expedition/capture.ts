import { markCaught, type Progress } from "@/lib/expedition/progress";

/**
 * Dificultad de presentación, no la probabilidad de la fórmula de juego.
 * La captura de esta etapa siempre termina si la secuencia se completa.
 *
 * tasa = capture_rate / 255
 * poder = suma(base_stat) / (6 × 255)
 * índice = 0.82 × (1 − tasa) + 0.18 × poder
 * dificultad = limitar(redondear(1 + 9 × índice), 1, 10)
 *
 * El 82 % del recorrido sale de la tasa. El 18 % sale de las estadísticas.
 * Los techos son los del recurso de PokéAPI, no una tabla por especie.
 */
export const CAPTURE_RATE_CEILING = 255;
export const STAT_SLOTS = 6;
export const STAT_CEILING = 255;
export const STAT_TOTAL_CEILING = STAT_SLOTS * STAT_CEILING;
const RATE_SHARE = 0.82;
const POWER_SHARE = 0.18;
const DIFFICULTY_SPAN = 9;

const TONE = [
  "Casi no resiste.",
  "Resistencia leve.",
  "Se mueve un momento.",
  "Opone una resistencia corta.",
  "La secuencia pide atención.",
  "Resistencia marcada.",
  "Cuesta sostener la captura.",
  "La secuencia es larga.",
  "Casi no cede.",
  "Resistencia máxima.",
] as const;

export const CAPTURE_BEATS = [
  "La señal se estabiliza.",
  "La criatura se mueve.",
  "La resistencia cede.",
  "La captura se afirma.",
] as const;

export type CaptureRun =
  | { status: "idle" }
  | {
      status: "running";
      encounterId: string;
      difficulty: number;
      step: number;
      steps: number;
    }
  | { status: "done"; encounterId: string }
  | { status: "aborted"; encounterId: string; reason: "cancel" | "save" };

export function captureDifficulty(
  captureRate: number,
  baseStats: readonly number[],
): number | null {
  if (
    !Number.isInteger(captureRate) ||
    captureRate < 0 ||
    captureRate > CAPTURE_RATE_CEILING
  ) {
    return null;
  }
  if (baseStats.length !== STAT_SLOTS) {
    return null;
  }

  let total = 0;
  for (const stat of baseStats) {
    if (!Number.isInteger(stat) || stat < 0 || stat > STAT_CEILING) {
      return null;
    }
    total += stat;
  }

  const rateResistance = (CAPTURE_RATE_CEILING - captureRate) / CAPTURE_RATE_CEILING;
  const power = total / STAT_TOTAL_CEILING;
  const index = RATE_SHARE * rateResistance + POWER_SHARE * power;
  return clamp(Math.round(1 + DIFFICULTY_SPAN * index), 1, 10);
}

export function captureSteps(difficulty: number): 3 | 4 | null {
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) {
    return null;
  }
  return difficulty <= 5 ? 3 : 4;
}

export function resistanceLabel(difficulty: number): string | null {
  const steps = captureSteps(difficulty);
  const tone = TONE[difficulty - 1];
  if (!steps || !tone) {
    return null;
  }
  const pace =
    steps === 3
      ? "Secuencia breve, 3 movimientos."
      : "Secuencia intensa, 4 movimientos.";
  return `Dificultad ${difficulty} de 10. ${tone} ${pace}`;
}

export function beginCapture(encounterId: string, difficulty: number): CaptureRun | null {
  const steps = captureSteps(difficulty);
  if (!steps || encounterId.length === 0) {
    return null;
  }
  return { status: "running", encounterId, difficulty, step: 0, steps };
}

export function stepCapture(run: CaptureRun): CaptureRun {
  if (run.status !== "running") {
    return run;
  }
  if (run.step + 1 >= run.steps) {
    return { status: "done", encounterId: run.encounterId };
  }
  return { ...run, step: run.step + 1 };
}

export function finishCapture(run: CaptureRun): CaptureRun {
  if (run.status !== "running") {
    return run;
  }
  return { status: "done", encounterId: run.encounterId };
}

export function abortCapture(run: CaptureRun): CaptureRun {
  if (run.status !== "running") {
    return run;
  }
  return { status: "aborted", encounterId: run.encounterId, reason: "cancel" };
}

/** Solo una secuencia terminada escribe el progreso. */
export function applyCapture(progress: Progress, run: CaptureRun): Progress {
  if (run.status !== "done") {
    return progress;
  }
  return markCaught(progress, run.encounterId);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
