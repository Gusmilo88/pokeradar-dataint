"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  acknowledgeBadge,
  BADGES_EVENT,
  BADGES_KEY,
  emptyBadgeLedger,
  parseBadgeLedger,
  readBadgeLedger,
  serializeBadgeLedger,
  stampUnlocks,
} from "@/lib/badges/ledger";
import { badgeSummary, evaluateBadges, type BadgeSummary, type BadgeView } from "@/lib/badges/evaluate";

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

export function useBadges(caught: ReadonlySet<string>): {
  badges: readonly BadgeView[];
  summary: BadgeSummary;
  acknowledge: (id: string) => void;
} {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const ledger = raw ? (parseBadgeLedger(raw) ?? emptyBadgeLedger()) : emptyBadgeLedger();
  const badges = evaluateBadges(caught, ledger);
  const summary = badgeSummary(badges);
  const caughtKey = [...caught].sort().join("|");

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
    const next = stampUnlocks(current, caughtSet(caughtKey), new Date().toISOString());
    if (next === current) {
      return;
    }
    try {
      publish(serializeBadgeLedger(next));
    } catch {
      return;
    }
  }, [caughtKey, raw]);

  const acknowledge = useCallback((id: string) => {
    let current = emptyBadgeLedger();
    try {
      current = readBadgeLedger(window.localStorage.getItem(BADGES_KEY));
    } catch {
      return;
    }
    const stamped = stampUnlocks(current, caughtSet(caughtKey), new Date().toISOString());
    const next = acknowledgeBadge(stamped, id);
    if (next === current) {
      return;
    }
    try {
      publish(serializeBadgeLedger(next));
    } catch {
      return;
    }
  }, [caughtKey]);

  return { badges, summary, acknowledge };
}
