import { KANTO_CATALOG } from "@/lib/expedition/kanto";

export const TEAM_VERSION = 1;
export const TEAM_KEY = "pokeradar.team.v1";
export const TEAM_EVENT = "pokeradar-team";
export const TEAM_LIMIT = 6;

const CATALOG_IDS = new Set(KANTO_CATALOG.map((entry) => entry.encounterId));

export function emptyTeam(): string[] {
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Un id ajeno, repetido, no capturado o un equipo de más de seis invalida el documento. */
export function parseTeam(raw: string, caught: ReadonlySet<string>): string[] | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== TEAM_VERSION || !Array.isArray(value.members)) {
      return null;
    }
    if (value.members.length > TEAM_LIMIT) {
      return null;
    }
    const members: string[] = [];
    for (const item of value.members) {
      if (typeof item !== "string" || !CATALOG_IDS.has(item) || !caught.has(item) || members.includes(item)) {
        return null;
      }
      members.push(item);
    }
    return members;
  } catch {
    return null;
  }
}

export function serializeTeam(members: readonly string[]): string {
  return JSON.stringify({ version: TEAM_VERSION, members });
}

export function addMember(members: readonly string[], encounterId: string, caught: ReadonlySet<string>): string[] {
  if (!caught.has(encounterId) || !CATALOG_IDS.has(encounterId) || members.includes(encounterId)) {
    return [...members];
  }
  if (members.length >= TEAM_LIMIT) {
    return [...members];
  }
  return [...members, encounterId];
}

export function removeMember(members: readonly string[], encounterId: string): string[] {
  return members.filter((id) => id !== encounterId);
}

export function moveMember(members: readonly string[], index: number, delta: -1 | 1): string[] {
  const next = index + delta;
  if (index < 0 || index >= members.length || next < 0 || next >= members.length) {
    return [...members];
  }
  const copy = [...members];
  const current = copy[index];
  const swap = copy[next];
  if (current === undefined || swap === undefined) {
    return [...members];
  }
  copy[index] = swap;
  copy[next] = current;
  return copy;
}
