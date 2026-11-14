"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { badgeSummary, evaluateBadges, type BadgeSummary, type BadgeView } from "@/lib/badges/evaluate";
import {
  acknowledgeBadge,
  adoptHeldUnlocks,
  BADGES_EVENT,
  BADGES_KEY,
  emptyBadgeLedger,
  markCollectionCelebrated,
  parseBadgeLedger,
  readBadgeLedger,
  serializeBadgeLedger,
  witnessUnlocks,
  type BadgeLedger,
} from "@/lib/badges/ledger";

export type BadgeCeremony =
  | { kind: "medal"; id: string }
  | { kind: "collection" };

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(BADGES_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(BADGES_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(BADGES_KEY) ?? "";
  } catch {
    return "";
  }
}

function publish(raw: string): void {
  window.localStorage.setItem(BADGES_KEY, raw);
  window.dispatchEvent(new Event(BADGES_EVENT));
}

function caughtSet(caughtKey: string): Set<string> {
  return new Set(caughtKey.length === 0 ? [] : caughtKey.split("|"));
}

function readStored(): BadgeLedger {
  return readBadgeLedger(window.localStorage.getItem(BADGES_KEY));
}

export function useBadges(caught: ReadonlySet<string>): {
  badges: readonly BadgeView[];
  summary: BadgeSummary;
  ceremony: BadgeCeremony | null;
  pending: number;
  dismissCeremony: () => void;
  skipCeremonies: () => void;
} {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const ledger = raw ? (parseBadgeLedger(raw) ?? emptyBadgeLedger()) : emptyBadgeLedger();
  const badges = evaluateBadges(caught, ledger);
  const summary = badgeSummary(badges);
  const caughtKey = [...caught].sort().join("|");
  const seenKey = useRef<string | null>(null);
  const [queue, setQueue] = useState<readonly BadgeCeremony[]>([]);
  const queueRef = useRef<readonly BadgeCeremony[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    let current = emptyBadgeLedger();
    try {
      const stored = window.localStorage.getItem(BADGES_KEY);
      if (stored && !parseBadgeLedger(stored)) {
        window.localStorage.removeItem(BADGES_KEY);
        window.dispatchEvent(new Event(BADGES_EVENT));
        return;
      }
      current = readBadgeLedger(stored);
    } catch {
      return;
    }
    const caughtNow = caughtSet(caughtKey);
    if (seenKey.current === null) {
      seenKey.current = caughtKey;
      const settled = adoptHeldUnlocks(current, caughtNow);
      if (settled === current) {
        return;
      }
      try {
        publish(serializeBadgeLedger(settled));
      } catch {
        return;
      }
      return;
    }
    if (seenKey.current === caughtKey) {
      return;
    }
    const previous = caughtSet(seenKey.current);
    seenKey.current = caughtKey;
    const result = witnessUnlocks(current, previous, caughtNow, new Date().toISOString());
    if (result.ledger !== current) {
      try {
        publish(serializeBadgeLedger(result.ledger));
      } catch {
        return;
      }
    }
    if (result.medals.length === 0 && !result.collection) {
      return;
    }
    const appended: BadgeCeremony[] = [
      ...result.medals.map((id) => ({ kind: "medal" as const, id })),
      ...(result.collection ? [{ kind: "collection" as const }] : []),
    ];
    setQueue((existing) => [...existing, ...appended]);
  }, [caughtKey, raw]);

  const settleHead = useCallback((items: readonly BadgeCeremony[]) => {
    let current = emptyBadgeLedger();
    try {
      current = readStored();
    } catch {
      return;
    }
    let next = current;
    for (const item of items) {
      next = item.kind === "collection" ? markCollectionCelebrated(next) : acknowledgeBadge(next, item.id);
    }
    if (next === current) {
      return;
    }
    try {
      publish(serializeBadgeLedger(next));
    } catch {
      return;
    }
  }, []);

  const dismissCeremony = useCallback(() => {
    const head = queueRef.current[0];
    if (!head) {
      return;
    }
    settleHead([head]);
    setQueue((current) => current.slice(1));
  }, [settleHead]);

  const skipCeremonies = useCallback(() => {
    const pending = queueRef.current;
    if (pending.length === 0) {
      return;
    }
    settleHead(pending);
    setQueue([]);
  }, [settleHead]);

  return {
    badges,
    summary,
    ceremony: queue[0] ?? null,
    pending: queue.length,
    dismissCeremony,
    skipCeremonies,
  };
}
