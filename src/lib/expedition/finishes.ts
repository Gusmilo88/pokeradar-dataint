import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import {
  cardFinish,
  finishUnlocked,
  type CardFinishId,
} from "@/lib/expedition/trainer-rewards";

/**
 * Preferencias cosméticas, aparte de seen/caught.
 * La ausencia de una especie significa acabado Base.
 * Un id ajeno, un acabado desconocido o uno de nivel superior vuelve a Base.
 */

export const FINISH_VERSION = 1;
export const FINISH_KEY = "pokeradar.finishes.v1";
export const FINISH_EVENT = "pokeradar-finishes";

const CATALOG_IDS = new Set(KANTO_CATALOG.map((entry) => entry.encounterId));

/** Solo acabados distintos de Base. Las claves son ids `kanto-NNN`. */
export type FinishMap = Readonly<Record<string, CardFinishId>>;

export function emptyFinishes(): FinishMap {
  return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Documento ilegible o de otra versión: null, para volver todo a Base.
 * Una entrada mala se omite y esa especie queda en Base.
 */
export function parseFinishes(raw: string): FinishMap | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== FINISH_VERSION || !Array.isArray(value.choices)) {
      return null;
    }
    const map: Record<string, CardFinishId> = {};
    for (const item of value.choices) {
      if (!isRecord(item) || typeof item.id !== "string" || typeof item.finish !== "string") {
        continue;
      }
      if (!CATALOG_IDS.has(item.id) || item.id in map) {
        continue;
      }
      const finish = cardFinish(item.finish);
      if (!finish || finish.id === "base") {
        continue;
      }
      map[item.id] = finish.id;
    }
    return map;
  } catch {
    return null;
  }
}

/** Deja solo capturados con un acabado que el nivel actual permite. */
export function applicableFinishes(
  map: FinishMap,
  caught: ReadonlySet<string>,
  level: number,
): FinishMap {
  const next: Record<string, CardFinishId> = {};
  for (const id of Object.keys(map).sort()) {
    const finish = map[id];
    if (!finish || !caught.has(id) || !finishUnlocked(finish, level)) {
      continue;
    }
    next[id] = finish;
  }
  return next;
}

export function readFinishes(raw: string | null, caught: ReadonlySet<string>, level: number): FinishMap {
  if (!raw) {
    return emptyFinishes();
  }
  const parsed = parseFinishes(raw);
  if (!parsed) {
    return emptyFinishes();
  }
  return applicableFinishes(parsed, caught, level);
}

export function finishOf(map: FinishMap, encounterId: string): CardFinishId {
  return map[encounterId] ?? "base";
}

export function assignFinish(
  map: FinishMap,
  encounterId: string,
  finishId: CardFinishId,
  caught: ReadonlySet<string>,
  level: number,
): FinishMap {
  if (!caught.has(encounterId) || !CATALOG_IDS.has(encounterId) || !finishUnlocked(finishId, level)) {
    return map;
  }
  if (finishId === "base") {
    if (!(encounterId in map)) {
      return map;
    }
    const next = { ...map };
    delete next[encounterId];
    return next;
  }
  if (map[encounterId] === finishId) {
    return map;
  }
  return { ...map, [encounterId]: finishId };
}

export function serializeFinishes(map: FinishMap): string {
  const choices = Object.keys(map)
    .sort()
    .flatMap((id) => {
      const finish = map[id];
      return finish && finish !== "base" ? [{ id, finish }] : [];
    });
  return JSON.stringify({ version: FINISH_VERSION, choices });
}
