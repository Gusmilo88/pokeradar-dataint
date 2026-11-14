import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import { DISCOVERY_STATES, type DiscoveryState } from "@/lib/expedition/discovery";

export const PROGRESS_VERSION = 1;
export const PROGRESS_KEY = "pokeradar.progress.v1";
export const PROGRESS_EVENT = "pokeradar-progress";

export interface Progress {
  seen: ReadonlySet<string>;
  caught: ReadonlySet<string>;
}

const CATALOG_IDS = new Set(KANTO_CATALOG.map((entry) => entry.encounterId));

export function emptyProgress(): Progress {
  return { seen: new Set(), caught: new Set() };
}

export function discoveryState(progress: Progress, encounterId: string): DiscoveryState {
  if (progress.caught.has(encounterId)) {
    return "caught";
  }
  if (progress.seen.has(encounterId)) {
    return "seen";
  }
  return "undiscovered";
}

export function tally(progress: Progress): { seen: number; caught: number } {
  return { seen: progress.seen.size, caught: progress.caught.size };
}

export function markSeen(progress: Progress, encounterId: string): Progress {
  if (!CATALOG_IDS.has(encounterId)) {
    return progress;
  }
  if (progress.caught.has(encounterId) || progress.seen.has(encounterId)) {
    return progress;
  }
  const seen = new Set(progress.seen);
  seen.add(encounterId);
  return { seen, caught: progress.caught };
}

/** Idempotente. Capturado implica visto y nunca vuelve a un estado anterior. */
export function markCaught(progress: Progress, encounterId: string): Progress {
  if (!CATALOG_IDS.has(encounterId) || progress.caught.has(encounterId)) {
    return progress;
  }
  const seen = new Set(progress.seen);
  seen.add(encounterId);
  const caught = new Set(progress.caught);
  caught.add(encounterId);
  return { seen, caught };
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify({
    version: PROGRESS_VERSION,
    seen: [...progress.seen].sort(),
    caught: [...progress.caught].sort(),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !CATALOG_IDS.has(item) || ids.includes(item)) {
      return null;
    }
    ids.push(item);
  }
  return ids;
}

/**
 * Versión distinta o forma inválida: progreso vacío.
 * Un id desconocido o repetido también invalida el documento, para no mezclar datos a medias.
 */
export function parseProgress(raw: string): Progress | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== PROGRESS_VERSION) {
      return null;
    }
    const seen = readIds(value.seen);
    const caught = readIds(value.caught);
    if (!seen || !caught) {
      return null;
    }
    const seenSet = new Set(seen);
    for (const id of caught) {
      seenSet.add(id);
    }
    return { seen: seenSet, caught: new Set(caught) };
  } catch {
    return null;
  }
}

export function readProgress(raw: string | null): Progress {
  if (!raw) {
    return emptyProgress();
  }
  return parseProgress(raw) ?? emptyProgress();
}

export { DISCOVERY_STATES };
