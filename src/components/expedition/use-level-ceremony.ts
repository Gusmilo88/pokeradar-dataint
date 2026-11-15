"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  dismissLevelCeremony,
  emptyLevelSession,
  noteCaught,
  skipLevelCeremonies,
  type LevelCeremonyPlan,
} from "@/lib/expedition/level-ceremony";

function caughtKey(caught: ReadonlySet<string>): string {
  return [...caught].sort().join("|");
}

export function useLevelCeremonies(caught: ReadonlySet<string>, ready: boolean): {
  ceremony: LevelCeremonyPlan | null;
  pending: number;
  dismiss: () => void;
  skip: () => void;
} {
  const key = caughtKey(caught);
  const sessionRef = useRef(emptyLevelSession());
  const [queue, setQueue] = useState<readonly LevelCeremonyPlan[]>([]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const ids = key.length === 0 ? [] : key.split("|");
    const next = noteCaught(sessionRef.current, new Set(ids));
    if (next === sessionRef.current) {
      return;
    }
    sessionRef.current = next;
    setQueue(next.queue);
  }, [key, ready]);

  const dismiss = useCallback(() => {
    sessionRef.current = dismissLevelCeremony(sessionRef.current);
    setQueue(sessionRef.current.queue);
  }, []);

  const skip = useCallback(() => {
    sessionRef.current = skipLevelCeremonies(sessionRef.current);
    setQueue(sessionRef.current.queue);
  }, []);

  return {
    ceremony: queue[0] ?? null,
    pending: queue.length,
    dismiss,
    skip,
  };
}
