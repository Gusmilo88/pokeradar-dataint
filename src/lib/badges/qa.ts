import { BADGES } from "@/lib/badges/badges-data";
import { witnessUnlocks, type BadgeLedger, type WitnessResult } from "@/lib/badges/ledger";

export function missingSpecies(badgeId: string, caught: ReadonlySet<string>): readonly string[] {
  const badge = BADGES.find((item) => item.id === badgeId);
  if (!badge || badge.rule.kind !== "allCaptured") {
    return [];
  }
  return badge.rule.speciesIds.filter((id) => !caught.has(id));
}

export function allBadgeSpecies(): readonly string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const badge of BADGES) {
    if (badge.rule.kind !== "allCaptured") {
      continue;
    }
    for (const id of badge.rule.speciesIds) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Suma especies al conjunto de prueba y deja que el motor real decida
 * qué medallas pasan de bloqueadas a conseguidas, incluidas las que comparten especies.
 */
export function qaCatch(
  caught: ReadonlySet<string>,
  ledger: BadgeLedger,
  speciesIds: readonly string[],
  nowIso: string,
): { caught: ReadonlySet<string>; result: WitnessResult } {
  let changed = false;
  const next = new Set(caught);
  for (const id of speciesIds) {
    if (!next.has(id)) {
      next.add(id);
      changed = true;
    }
  }
  if (!changed) {
    return { caught, result: { ledger, medals: [], collection: false } };
  }
  return { caught: next, result: witnessUnlocks(ledger, caught, next, nowIso) };
}
