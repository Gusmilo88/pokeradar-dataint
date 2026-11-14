import { BADGES } from "@/lib/badges/badges-data";
import { isBadgeUnlocked } from "@/lib/badges/evaluate";

export const BADGES_VERSION = 1;
export const BADGES_KEY = "pokeradar.badges.v1";
export const BADGES_EVENT = "pokeradar-badges";

export interface BadgeRecord {
  /** Null si la medalla ya estaba obtenida y no vimos el momento. */
  unlockedAt: string | null;
  acknowledged: boolean;
  /** La celebración automática ya se mostró, o no corresponde mostrarla. */
  celebrated: boolean;
}

export interface BadgeLedger {
  records: Readonly<Record<string, BadgeRecord>>;
  collectionCelebrated: boolean;
}

export interface WitnessResult {
  ledger: BadgeLedger;
  medals: readonly string[];
  collection: boolean;
}

const EMPTY_LEDGER: BadgeLedger = { records: {}, collectionCelebrated: false };

const BADGE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function emptyBadgeLedger(): BadgeLedger {
  return EMPTY_LEDGER;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown): BadgeRecord | null {
  if (!isRecord(value) || typeof value.acknowledged !== "boolean") {
    return null;
  }
  let unlockedAt: string | null;
  if (value.unlockedAt === null) {
    unlockedAt = null;
  } else if (typeof value.unlockedAt === "string" && value.unlockedAt.length > 0) {
    unlockedAt = value.unlockedAt;
  } else {
    return null;
  }
  const celebrated = typeof value.celebrated === "boolean" ? value.celebrated : true;
  return { unlockedAt, acknowledged: value.acknowledged, celebrated };
}

export function parseBadgeLedger(raw: string): BadgeLedger | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== BADGES_VERSION || !isRecord(value.records)) {
      return null;
    }
    const collectionCelebrated = value.collectionCelebrated === undefined ? false : value.collectionCelebrated;
    if (typeof collectionCelebrated !== "boolean") {
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
    return { records, collectionCelebrated };
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
    records[id] = {
      unlockedAt: record.unlockedAt,
      acknowledged: record.acknowledged,
      celebrated: record.celebrated,
    };
  }
  return JSON.stringify({
    version: BADGES_VERSION,
    collectionCelebrated: ledger.collectionCelebrated,
    records,
  });
}

export function readBadgeLedger(raw: string | null): BadgeLedger {
  if (!raw) {
    return emptyBadgeLedger();
  }
  return parseBadgeLedger(raw) ?? emptyBadgeLedger();
}

function withRecord(ledger: BadgeLedger, id: string, record: BadgeRecord): BadgeLedger {
  return {
    collectionCelebrated: ledger.collectionCelebrated,
    records: { ...ledger.records, [id]: record },
  };
}

/**
 * Medallas que ya estaban completas al abrir la página.
 * No inventa fecha y no arma celebración.
 */
export function adoptHeldUnlocks(ledger: BadgeLedger, caught: ReadonlySet<string>): BadgeLedger {
  let next = ledger;
  for (const badge of BADGES) {
    if (!isBadgeUnlocked(badge, caught)) {
      continue;
    }
    const existing = next.records[badge.id];
    if (!existing) {
      next = withRecord(next, badge.id, { unlockedAt: null, acknowledged: true, celebrated: true });
      continue;
    }
    if (!existing.celebrated || !existing.acknowledged) {
      next = withRecord(next, badge.id, {
        unlockedAt: existing.unlockedAt,
        acknowledged: true,
        celebrated: true,
      });
    }
  }
  if (BADGES.every((badge) => isBadgeUnlocked(badge, caught)) && !next.collectionCelebrated) {
    next = { records: next.records, collectionCelebrated: true };
  }
  return next;
}

/**
 * Transición real bloqueada → conseguida entre dos conjuntos de capturas.
 * La fecha es la de este momento. No pisa una fecha ya guardada.
 */
export function witnessUnlocks(
  ledger: BadgeLedger,
  previous: ReadonlySet<string>,
  nextCaught: ReadonlySet<string>,
  nowIso: string,
): WitnessResult {
  const medals: string[] = [];
  let next = ledger;
  for (const badge of BADGES) {
    const wasUnlocked = isBadgeUnlocked(badge, previous);
    const isUnlocked = isBadgeUnlocked(badge, nextCaught);
    if (!isUnlocked || wasUnlocked || next.records[badge.id]?.celebrated) {
      continue;
    }
    medals.push(badge.id);
    const existing = next.records[badge.id];
    next = withRecord(next, badge.id, {
      unlockedAt: existing?.unlockedAt ?? nowIso,
      acknowledged: false,
      celebrated: false,
    });
  }
  const collection = medals.length > 0
    && !ledger.collectionCelebrated
    && BADGES.every((badge) => isBadgeUnlocked(badge, nextCaught));
  return { ledger: next, medals, collection };
}

export function acknowledgeBadge(ledger: BadgeLedger, id: string): BadgeLedger {
  const record = ledger.records[id];
  if (!record || (record.acknowledged && record.celebrated)) {
    return ledger;
  }
  return withRecord(ledger, id, {
    unlockedAt: record.unlockedAt,
    acknowledged: true,
    celebrated: true,
  });
}

export function markCollectionCelebrated(ledger: BadgeLedger): BadgeLedger {
  if (ledger.collectionCelebrated) {
    return ledger;
  }
  return { records: ledger.records, collectionCelebrated: true };
}

export function clearStoredBadges(): void {
  try {
    window.localStorage.removeItem(BADGES_KEY);
    window.dispatchEvent(new Event(BADGES_EVENT));
  } catch {
    return;
  }
}
