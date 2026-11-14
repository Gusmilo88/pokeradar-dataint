import { filterAlbum, type AlbumFilter } from "@/lib/expedition/album";
import { captureDifficulty } from "@/lib/expedition/capture";
import type { CatalogEntry } from "@/lib/expedition/kanto";
import { discoveryState, type Progress } from "@/lib/expedition/progress";

export const GENERATION_LABEL = "Generación I";

export const SORT_KEYS = [
  "expedition",
  "name",
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
  "difficulty",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";
export type TypeMode = "any" | "all";

export interface RevealedFacts {
  types: readonly string[];
  stats: Readonly<Record<string, number>>;
  captureRate: number;
  label: string;
}

const STAT_KEY: Partial<Record<SortKey, string>> = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "special-attack",
  "special-defense": "special-defense",
  speed: "speed",
};

export function revealedTypeNames(facts: ReadonlyMap<string, RevealedFacts>): string[] {
  const names = new Set<string>();
  for (const fact of facts.values()) {
    for (const type of fact.types) {
      names.add(type);
    }
  }
  return [...names].sort();
}

function passesTypes(
  entry: CatalogEntry,
  progress: Progress,
  facts: ReadonlyMap<string, RevealedFacts>,
  types: readonly string[],
  mode: TypeMode,
): boolean {
  if (types.length === 0) {
    return true;
  }
  if (discoveryState(progress, entry.encounterId) === "undiscovered") {
    return false;
  }
  const known = facts.get(entry.encounterId);
  if (!known) {
    return false;
  }
  if (mode === "all") {
    return types.every((type) => known.types.includes(type));
  }
  return types.some((type) => known.types.includes(type));
}

function numericValue(
  entry: CatalogEntry,
  fact: RevealedFacts | undefined,
  key: SortKey,
): number | null {
  if (!fact) {
    return null;
  }
  if (key === "difficulty") {
    const stats = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].map(
      (name) => fact.stats[name],
    );
    if (stats.some((value) => value === undefined)) {
      return null;
    }
    return captureDifficulty(fact.captureRate, stats as number[]);
  }
  const statName = STAT_KEY[key];
  if (!statName) {
    return null;
  }
  const value = fact.stats[statName];
  return value === undefined ? null : value;
}

export function queryAlbum(
  entries: readonly CatalogEntry[],
  progress: Progress,
  filter: AlbumFilter,
  query: string,
  types: readonly string[],
  mode: TypeMode,
  sortKey: SortKey,
  direction: SortDirection,
  facts: ReadonlyMap<string, RevealedFacts>,
): CatalogEntry[] {
  const filtered = filterAlbum(entries, progress, filter, query).filter((entry) =>
    passesTypes(entry, progress, facts, types, mode),
  );
  if (sortKey === "expedition") {
    const ordered = [...filtered].sort((left, right) => left.expeditionNumber - right.expeditionNumber);
    return direction === "desc" ? ordered.reverse() : ordered;
  }
  const known: { entry: CatalogEntry; value: number | string }[] = [];
  const hidden: CatalogEntry[] = [];
  for (const entry of filtered) {
    const state = discoveryState(progress, entry.encounterId);
    if (state === "undiscovered") {
      hidden.push(entry);
      continue;
    }
    const fact = facts.get(entry.encounterId);
    if (sortKey === "name") {
      known.push({ entry, value: fact?.label ?? entry.speciesName });
      continue;
    }
    const value = numericValue(entry, fact, sortKey);
    if (value === null) {
      hidden.push(entry);
      continue;
    }
    known.push({ entry, value });
  }
  known.sort((left, right) => {
    if (typeof left.value === "string" && typeof right.value === "string") {
      return left.value.localeCompare(right.value, "es");
    }
    return Number(left.value) - Number(right.value);
  });
  if (direction === "desc") {
    known.reverse();
  }
  hidden.sort((left, right) => left.expeditionNumber - right.expeditionNumber);
  return [...known.map((item) => item.entry), ...hidden];
}
