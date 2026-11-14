"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { badgeSummary, evaluateBadges, type BadgeSummary, type BadgeView } from "@/lib/badges/evaluate";
import {
  acknowledgeBadge,
  emptyBadgeLedger,
  markCollectionCelebrated,
  type BadgeLedger,
} from "@/lib/badges/ledger";
import { allBadgeSpecies, missingSpecies, qaCatch } from "@/lib/badges/qa";
import type { BadgeCeremony } from "@/components/expedition/use-badges";

/**
 * Sesión de demostración. El conjunto y la bitácora viven en memoria:
 * no se publican en el almacenamiento de la partida.
 */
export function useDemoBadgeSession(active: boolean): {
  badges: readonly BadgeView[];
  summary: BadgeSummary;
  ceremony: BadgeCeremony | null;
  pending: number;
  dismissCeremony: () => void;
  skipCeremonies: () => void;
  completeBadge: (id: string) => void;
  completeAll: () => void;
  resetDemo: () => void;
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

  const resetDemo = useCallback(() => {
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
      resetDemo();
    }
    wasActive.current = active;
  }, [active, resetDemo]);

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
    if (!active) {
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
    resetDemo,
  };
}
