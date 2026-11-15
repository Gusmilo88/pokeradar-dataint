import {
  cardFinish,
  finishUnlocked,
  type CardFinishId,
} from "@/lib/expedition/trainer-rewards";

/**
 * Un solo acabado para toda la colección.
 * `pokeradar.finishes.v1` era una elección por especie: no se convierte en una selección global.
 * Si ese documento, u otro ambiguo, aparece, el valor seguro es Base.
 */

export const FINISH_VERSION = 2;
export const FINISH_KEY = "pokeradar.finishes.v2";
export const FINISH_KEY_V1 = "pokeradar.finishes.v1";
export const FINISH_EVENT = "pokeradar-finishes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `legacy` es el documento por especie. null es un texto ilegible. */
export function parseEquipped(raw: string): CardFinishId | "legacy" | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || typeof value.version !== "number") {
      return null;
    }
    if (value.version === 1 || Array.isArray(value.choices)) {
      return "legacy";
    }
    if (value.version !== FINISH_VERSION || typeof value.finish !== "string") {
      return null;
    }
    return cardFinish(value.finish)?.id ?? null;
  } catch {
    return null;
  }
}

/** Ausencia, legado o nivel insuficiente: Base. No inventa un metal a partir de v1. */
export function equippedFinish(raw: string | null, level: number): CardFinishId {
  if (!raw) {
    return "base";
  }
  const parsed = parseEquipped(raw);
  if (!parsed || parsed === "legacy" || !finishUnlocked(parsed, level)) {
    return "base";
  }
  return parsed;
}

export function equipFinish(current: CardFinishId, next: CardFinishId, level: number): CardFinishId {
  if (!finishUnlocked(next, level)) {
    return current;
  }
  return next;
}

export function serializeFinish(id: CardFinishId): string {
  return JSON.stringify({ version: FINISH_VERSION, finish: id });
}
