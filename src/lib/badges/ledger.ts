import { BADGES } from "@/lib/badges/badges-data";
import { isBadgeUnlocked } from "@/lib/badges/evaluate";

export const BADGES_VERSION = 1;
export const BADGES_KEY = "pokeradar.badges.v1";
export const BADGES_EVENT = "pokeradar-badges";

export interface BadgeRecord {
  unlockedAt: string;
  acknowledged: boolean;
}

export interface BadgeLedger {
  records: Readonly<Record<string, BadgeRecord>>;
}

const EMPTY_LEDGER: BadgeLedger = { records: {} };

const BADGE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function emptyBadgeLedger(): BadgeLedger {
  return EMPTY_LEDGER;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown): BadgeRecord | null {
  if (!isRecord(value) || typeof value.unlockedAt !== "string" || value.unlockedAt.length === 0) {
    return null;
  }
  if (typeof value.acknowledged !== "boolean") {
    return null;
  }
  return { unlockedAt: value.unlockedAt, acknowledged: value.acknowledged };
}

export function parseBadgeLedger(raw: string): BadgeLedger | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== BADGES_VERSION || !isRecord(value.records)) {
      return null;
    }
    const records: Record<string, BadgeRecord> = {};
    for (const [id, entry] of Object.entries(value.records)) {
      if (!BADGE_ID.test(id)) {
        return null;
      }
      const record = readRecord(entry);
      if (!record) {
        return null;
      }
      records[id] = record;
    }
    return { records };
  } catch {
    return null;
  }
}

export function serializeBadgeLedger(ledger: BadgeLedger): string {
  const records: Record<string, BadgeRecord> = {};
  for (const id of Object.keys(ledger.records).sort()) {
    const record = ledger.records[id];
    if (!record) {
      continue;
    }
    records[id] = { unlockedAt: record.unlockedAt, acknowledged: record.acknowledged };
  }
  return JSON.stringify({ version: BADGES_VERSION, records });
}

export function readBadgeLedger(raw: string | null): BadgeLedger {
  if (!raw) {
    return emptyBadgeLedger();
  }
  return parseBadgeLedger(raw) ?? emptyBadgeLedger();
}

/** Anota la primera vez que la regla se cumple. No pisa una fecha ya guardada. */
export function stampUnlocks(
  ledger: BadgeLedger,
  caught: ReadonlySet<string>,
  nowIso: string,
): BadgeLedger {
  let records = ledger.records;
  let changed = false;
  for (const badge of BADGES) {
    if (records[badge.id] || !isBadgeUnlocked(badge, caught)) {
      continue;
    }
    if (!changed) {
      records = { ...records };
      changed = true;
    }
    records = {
      ...records,
      [badge.id]: { unlockedAt: nowIso, acknowledged: false },
    };
  }
  if (!changed) {
    return ledger;
  }
  return { records };
}

export function acknowledgeBadge(ledger: BadgeLedger, id: string): BadgeLedger {
  const record = ledger.records[id];
  if (!record || record.acknowledged) {
    return ledger;
  }
  return {
    records: {
      ...ledger.records,
      [id]: { unlockedAt: record.unlockedAt, acknowledged: true },
    },
  };
}

export function clearStoredBadges(): void {
  try {
    window.localStorage.removeItem(BADGES_KEY);
    window.dispatchEvent(new Event(BADGES_EVENT));
  } catch {
    return;
  }
}
