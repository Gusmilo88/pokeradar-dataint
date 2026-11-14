"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { badgeSummary, evaluateBadges, type BadgeSummary, type BadgeView } from "@/lib/badges/evaluate";
import {
  acknowledgeBadge,
  emptyBadgeLedger,
  markCollectionCelebrated,
  type BadgeLedger,
} from "@/lib/badges/ledger";
import { allBadgeSpecies, badgeQaEnabled, missingSpecies, qaCatch } from "@/lib/badges/qa";
import type { BadgeCeremony } from "@/components/expedition/use-badges";

const QA_EVENT = "pokeradar-qa-badges";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(QA_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(QA_EVENT, onStoreChange);
  };
}

function readSearch(): string {
  return window.location.search;
}

export function useBadgeQaMode(): { active: boolean; exit: () => void } {
  const search = useSyncExternalStore(subscribe, readSearch, () => "");
  const active = badgeQaEnabled(search);
  const exit = useCallback(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("qaBadges");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new Event(QA_EVENT));
  }, []);
  return { active, exit };
}

export function useQaBadgeSession(active: boolean): {
  badges: readonly BadgeView[];
  summary: BadgeSummary;
  ceremony: BadgeCeremony | null;
  pending: number;
  dismissCeremony: () => void;
  skipCeremonies: () => void;
  completeBadge: (id: string) => void;
  completeAll: () => void;
  resetQa: () => void;
} {
  const caughtRef = useRef<ReadonlySet<string>>(new Set());
  const ledgerRef = useRef<BadgeLedger>(emptyBadgeLedger());
  const [caught, setCaught] = useState<ReadonlySet<string>>(() => new Set());
  const [ledger, setLedger] = useState<BadgeLedger>(() => emptyBadgeLedger());
  const [queue, setQueue] = useState<readonly BadgeCeremony[]>([]);
  const queueRef = useRef<readonly BadgeCeremony[]>([]);
  const wasActive = useRef(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const resetQa = useCallback(() => {
    const blankCaught = new Set<string>();
    const blank = emptyBadgeLedger();
    caughtRef.current = blankCaught;
    ledgerRef.current = blank;
    setCaught(blankCaught);
    setLedger(blank);
    setQueue([]);
  }, []);

  useEffect(() => {
    if (active && !wasActive.current) {
      resetQa();
    }
    wasActive.current = active;
  }, [active, resetQa]);

  const enqueue = useCallback((medals: readonly string[], collection: boolean) => {
    if (medals.length === 0 && !collection) {
      return;
    }
    const appended: BadgeCeremony[] = [
      ...medals.map((id) => ({ kind: "medal" as const, id })),
      ...(collection ? [{ kind: "collection" as const }] : []),
    ];
    setQueue((existing) => [...existing, ...appended]);
  }, []);

  const complete = useCallback((speciesIds: readonly string[]) => {
    if (!active || process.env.NODE_ENV !== "development") {
      return;
    }
    const step = qaCatch(caughtRef.current, ledgerRef.current, speciesIds, new Date().toISOString());
    if (step.caught === caughtRef.current) {
      return;
    }
    caughtRef.current = step.caught;
    ledgerRef.current = step.result.ledger;
    setCaught(step.caught);
    setLedger(step.result.ledger);
    enqueue(step.result.medals, step.result.collection);
  }, [active, enqueue]);

  const completeBadge = useCallback((id: string) => {
    complete(missingSpecies(id, caughtRef.current));
  }, [complete]);

  const completeAll = useCallback(() => {
    complete(allBadgeSpecies());
  }, [complete]);

  const settle = useCallback((items: readonly BadgeCeremony[]) => {
    let next = ledgerRef.current;
    for (const item of items) {
      next = item.kind === "collection" ? markCollectionCelebrated(next) : acknowledgeBadge(next, item.id);
    }
    ledgerRef.current = next;
    setLedger(next);
  }, []);

  const dismissCeremony = useCallback(() => {
    const head = queueRef.current[0];
    if (!head) {
      return;
    }
    settle([head]);
    setQueue((current) => current.slice(1));
  }, [settle]);

  const skipCeremonies = useCallback(() => {
    const pending = queueRef.current;
    if (pending.length === 0) {
      return;
    }
    settle(pending);
    setQueue([]);
  }, [settle]);

  const badges = evaluateBadges(caught, ledger);
  return {
    badges,
    summary: badgeSummary(badges),
    ceremony: queue[0] ?? null,
    pending: queue.length,
    dismissCeremony,
    skipCeremonies,
    completeBadge,
    completeAll,
    resetQa,
  };
}
