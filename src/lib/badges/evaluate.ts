import {
  BADGES,
  type BadgeDefinition,
  type BadgePalette,
  type BadgeRule,
} from "@/lib/badges/badges-data";
import type { BadgeLedger } from "@/lib/badges/ledger";

export type BadgePresentation = "locked" | "earned" | "fresh";

export interface BadgeSpeciesState {
  encounterId: string;
  label: string;
  captured: boolean;
}

export interface BadgeView {
  id: string;
  slug: string;
  name: string;
  description: string;
  condition: string;
  assetPath: string;
  palette: BadgePalette;
  rarity: BadgeDefinition["rarity"];
  visualClass: string;
  species: readonly BadgeSpeciesState[];
  captured: number;
  total: number;
  progressPercent: number;
  missing: readonly BadgeSpeciesState[];
  unlocked: boolean;
  unlockedAt: string | null;
  presentation: BadgePresentation;
}

export interface BadgeSummary {
  earned: number;
  total: number;
  percent: number;
}

function dedupe(speciesIds: readonly string[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const id of speciesIds) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function capturedCount(caught: ReadonlySet<string>, speciesIds: readonly string[]): number {
  let count = 0;
  for (const id of dedupe(speciesIds)) {
    if (caught.has(id)) {
      count += 1;
    }
  }
  return count;
}

export function allCaptured(caught: ReadonlySet<string>, speciesIds: readonly string[]): boolean {
  const ids = dedupe(speciesIds);
  if (ids.length === 0) {
    return false;
  }
  return capturedCount(caught, ids) === ids.length;
}

export function progressPercent(captured: number, total: number): number {
  if (total <= 0 || captured <= 0) {
    return 0;
  }
  if (captured >= total) {
    return 100;
  }
  return Math.round((captured / total) * 100);
}

interface MeasuredRule {
  ids: readonly string[];
  captured: number;
  total: number;
  unlocked: boolean;
}

function unknownRule(rule: BadgeRule): never {
  throw new Error(`Regla de medalla desconocida: ${rule.kind}`);
}

/** Resuelve la regla declarativa. Un `kind` nuevo se agrega acá. */
function measured(rule: BadgeRule, caught: ReadonlySet<string>): MeasuredRule {
  if (rule.kind === "allCaptured") {
    const ids = dedupe(rule.speciesIds);
    const captured = capturedCount(caught, ids);
    return {
      ids,
      captured,
      total: ids.length,
      unlocked: allCaptured(caught, ids),
    };
  }
  return unknownRule(rule);
}

export function isBadgeUnlocked(badge: BadgeDefinition, caught: ReadonlySet<string>): boolean {
  return measured(badge.rule, caught).unlocked;
}

function speciesStates(badge: BadgeDefinition, ids: readonly string[], caught: ReadonlySet<string>): BadgeSpeciesState[] {
  const labels = new Map(badge.species.map((item) => [item.encounterId, item.label]));
  return ids.map((encounterId) => ({
    encounterId,
    label: labels.get(encounterId) ?? encounterId,
    captured: caught.has(encounterId),
  }));
}

export function evaluateBadge(
  badge: BadgeDefinition,
  caught: ReadonlySet<string>,
  ledger: BadgeLedger,
): BadgeView {
  const result = measured(badge.rule, caught);
  const species = speciesStates(badge, result.ids, caught);
  const record = ledger.records[badge.id];
  let presentation: BadgePresentation = "locked";
  if (result.unlocked) {
    presentation = record && !record.celebrated ? "fresh" : "earned";
  }
  return {
    id: badge.id,
    slug: badge.slug,
    name: badge.name,
    description: badge.description,
    condition: badge.condition,
    assetPath: badge.assetPath,
    palette: badge.palette,
    rarity: badge.rarity,
    visualClass: badge.visualClass,
    species,
    captured: result.captured,
    total: result.total,
    progressPercent: progressPercent(result.captured, result.total),
    missing: species.filter((item) => !item.captured),
    unlocked: result.unlocked,
    unlockedAt: record?.unlockedAt ?? null,
    presentation,
  };
}

export function evaluateBadges(caught: ReadonlySet<string>, ledger: BadgeLedger): BadgeView[] {
  return BADGES.map((badge) => evaluateBadge(badge, caught, ledger));
}

export function badgeSummary(badges: readonly BadgeView[]): BadgeSummary {
  const earned = badges.filter((badge) => badge.unlocked).length;
  return {
    earned,
    total: badges.length,
    percent: progressPercent(earned, badges.length),
  };
}
