import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import {
  TRAINER_XP_CATALOG,
  type TrainerXpEntry,
} from "@/lib/expedition/trainer-xp-catalog";

/**
 * Curva de XP de expedición. No es la curva de los videojuegos.
 *
 * Hay 10 niveles y 9 umbrales. El paso k (1–9) es la XP acumulada para
 * alcanzar el nivel k + 1. El peso de cada paso es el cuadrado de su índice,
 * así los primeros niveles piden poco y los últimos mucho.
 *
 *   S(k) = 1² + … + k² = k (k + 1) (2k + 1) / 6
 *   S(9) = 285
 *   umbral(k) = redondeo(T × S(k) / 285) = redondeo(T × k (k + 1) (2k + 1) / 1710)
 *
 * T es la suma de `base_experience` del catálogo. El redondeo es mitad hacia
 * arriba, en enteros. Con k = 9 el cociente es 1, así el nivel 10 exige
 * exactamente T y solo se alcanza al capturar las 56 especies.
 */

export const TRAINER_LEVEL_CAP = 10;
export const TRAINER_LEVEL_STEPS = 9;

const SQUARE_SUM_THROUGH_CAP = 285;
const THRESHOLD_DENOMINATOR = 6 * SQUARE_SUM_THROUGH_CAP;

export interface TrainerLevelProgress {
  xp: number;
  maxXp: number;
  level: number;
  /** El nivel actual: la XP solo crece con capturas nuevas, así que no hay otra marca. */
  highestLevel: number;
  levelCap: number;
  atCap: boolean;
  xpIntoLevel: number;
  levelSpan: number;
  xpToNext: number;
  /** Entero 0–100 dentro del nivel actual. En el nivel máximo es 100. */
  percent: number;
  nextLevel: number | null;
}

export type TrainerXpAssessment =
  | { complete: true; progress: TrainerLevelProgress }
  | { complete: false; issues: readonly string[] };

export interface CaptureXpShift {
  encounterId: string;
  counted: boolean;
  xpGained: number;
  fromLevel: number;
  toLevel: number;
  leveledUp: boolean;
  before: TrainerLevelProgress;
  after: TrainerLevelProgress;
}

export function validateTrainerXpCatalog(entries: readonly TrainerXpEntry[]): readonly string[] {
  const issues: string[] = [];
  if (entries.length !== KANTO_CATALOG.length) {
    issues.push(`El catálogo de XP tiene ${entries.length} fichas y la expedición tiene ${KANTO_CATALOG.length}.`);
  }

  const seenNational = new Set<number>();
  const byEncounter = new Map<string, TrainerXpEntry>();
  for (const entry of entries) {
    if (!Number.isInteger(entry.nationalId) || entry.nationalId < 1) {
      issues.push(`Id nacional inválido: ${String(entry.nationalId)}.`);
    } else if (seenNational.has(entry.nationalId)) {
      issues.push(`Id nacional repetido: ${entry.nationalId}.`);
    } else {
      seenNational.add(entry.nationalId);
    }

    if (byEncounter.has(entry.encounterId)) {
      issues.push(`Encuentro repetido: ${entry.encounterId}.`);
    } else {
      byEncounter.set(entry.encounterId, entry);
    }

    if (!Number.isInteger(entry.baseExperience) || entry.baseExperience < 1) {
      issues.push(`base_experience inválida para ${entry.encounterId}.`);
    }
  }

  for (const species of KANTO_CATALOG) {
    const row = byEncounter.get(species.encounterId);
    if (!row) {
      issues.push(`Falta la XP de ${species.encounterId}.`);
      continue;
    }
    if (row.nationalId !== species.nationalId) {
      issues.push(`El id nacional de ${species.encounterId} no coincide.`);
    }
  }

  if (issues.length === 0) {
    const total = entries.reduce((sum, entry) => sum + entry.baseExperience, 0);
    if (levelThresholds(total) === null) {
      issues.push("La curva no mantiene nueve umbrales crecientes que terminen en el total.");
    }
  }

  return issues;
}

/** Umbral k, con redondeo mitad hacia arriba. `null` si el paso o el total no sirven. */
export function thresholdForStep(step: number, total: number): number | null {
  if (!Number.isInteger(step) || step < 1 || step > TRAINER_LEVEL_STEPS) {
    return null;
  }
  if (!Number.isInteger(total) || total < 1) {
    return null;
  }
  if (THRESHOLD_DENOMINATOR === 0) {
    return null;
  }
  const numerator = total * step * (step + 1) * (2 * step + 1);
  const quotient = Math.floor(numerator / THRESHOLD_DENOMINATOR);
  const remainder = numerator % THRESHOLD_DENOMINATOR;
  return remainder * 2 >= THRESHOLD_DENOMINATOR ? quotient + 1 : quotient;
}

/** Nueve umbrales estrictamente crecientes, el último igual a `total`. */
export function levelThresholds(total: number): readonly number[] | null {
  const values: number[] = [];
  for (let step = 1; step <= TRAINER_LEVEL_STEPS; step += 1) {
    const value = thresholdForStep(step, total);
    const previous = values[values.length - 1] ?? 0;
    if (value === null || value <= previous) {
      return null;
    }
    values.push(value);
  }
  if (values[TRAINER_LEVEL_STEPS - 1] !== total) {
    return null;
  }
  return values;
}

export function maxExpeditionXp(entries: readonly TrainerXpEntry[] = TRAINER_XP_CATALOG): number | null {
  if (validateTrainerXpCatalog(entries).length > 0) {
    return null;
  }
  return entries.reduce((sum, entry) => sum + entry.baseExperience, 0);
}

export function expeditionXp(
  caught: ReadonlySet<string>,
  entries: readonly TrainerXpEntry[] = TRAINER_XP_CATALOG,
): number | null {
  if (validateTrainerXpCatalog(entries).length > 0) {
    return null;
  }
  const award = new Map(entries.map((entry) => [entry.encounterId, entry.baseExperience]));
  let total = 0;
  for (const id of caught) {
    const xp = award.get(id);
    if (xp !== undefined) {
      total += xp;
    }
  }
  return total;
}

export function levelForXp(xp: number, total: number): number | null {
  if (!Number.isInteger(xp) || xp < 0 || !Number.isInteger(total) || total < 1) {
    return null;
  }
  const thresholds = levelThresholds(total);
  if (!thresholds) {
    return null;
  }
  let level = 1;
  for (let index = 0; index < thresholds.length; index += 1) {
    const threshold = thresholds[index];
    if (threshold === undefined || xp < threshold) {
      break;
    }
    level = index + 2;
  }
  return level;
}

export function isMaxLevel(level: number): boolean {
  return level === TRAINER_LEVEL_CAP;
}

export function progressForXp(xp: number, total: number): TrainerLevelProgress | null {
  const level = levelForXp(xp, total);
  const thresholds = levelThresholds(total);
  if (level === null || !thresholds) {
    return null;
  }

  const atCap = level >= TRAINER_LEVEL_CAP;
  const floor = atCap
    ? (thresholds[TRAINER_LEVEL_STEPS - 2] ?? 0)
    : level === 1
      ? 0
      : (thresholds[level - 2] ?? 0);
  const nextThreshold = thresholds[level - 1];
  const ceiling = atCap || nextThreshold === undefined ? total : nextThreshold;
  const openSpan = ceiling - floor;
  if (openSpan <= 0) {
    return null;
  }

  const shownXp = Math.min(xp, total);
  const xpIntoLevel = atCap ? openSpan : shownXp - floor;
  const percent = atCap
    ? 100
    : Math.min(100, Math.max(0, Math.floor((xpIntoLevel * 100) / openSpan)));
  return {
    xp: shownXp,
    maxXp: total,
    level,
    highestLevel: level,
    levelCap: TRAINER_LEVEL_CAP,
    atCap,
    xpIntoLevel,
    levelSpan: openSpan,
    xpToNext: atCap ? 0 : openSpan - xpIntoLevel,
    percent,
    nextLevel: atCap ? null : level + 1,
  };
}

export function assessExpedition(
  caught: ReadonlySet<string>,
  entries: readonly TrainerXpEntry[] = TRAINER_XP_CATALOG,
): TrainerXpAssessment {
  const issues = validateTrainerXpCatalog(entries);
  if (issues.length > 0) {
    return { complete: false, issues };
  }
  const total = maxExpeditionXp(entries);
  const xp = expeditionXp(caught, entries);
  if (total === null || xp === null) {
    return { complete: false, issues: ["No se pudo sumar la XP de expedición."] };
  }
  const progress = progressForXp(xp, total);
  if (!progress) {
    return { complete: false, issues: ["La XP capturada no entra en la curva."] };
  }
  return { complete: true, progress };
}

/**
 * Diferencia de nivel al incorporar un id al conjunto capturado.
 * Un id ya capturado, visto o ajeno al catálogo no otorga XP.
 * No muta el conjunto recibido.
 */
export function captureXpShift(
  caught: ReadonlySet<string>,
  encounterId: string,
  entries: readonly TrainerXpEntry[] = TRAINER_XP_CATALOG,
): CaptureXpShift | { complete: false; issues: readonly string[] } {
  const before = assessExpedition(caught, entries);
  if (!before.complete) {
    return before;
  }
  const known = entries.some((entry) => entry.encounterId === encounterId);
  const already = caught.has(encounterId);
  const next = new Set(caught);
  if (known && !already) {
    next.add(encounterId);
  }
  const after = assessExpedition(next, entries);
  if (!after.complete) {
    return after;
  }
  return {
    encounterId,
    counted: known && !already,
    xpGained: after.progress.xp - before.progress.xp,
    fromLevel: before.progress.level,
    toLevel: after.progress.level,
    leveledUp: after.progress.level > before.progress.level,
    before: before.progress,
    after: after.progress,
  };
}
