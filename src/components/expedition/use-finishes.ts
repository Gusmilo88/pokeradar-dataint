"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  applicableFinishes,
  assignFinish,
  emptyFinishes,
  FINISH_EVENT,
  FINISH_KEY,
  finishOf,
  parseFinishes,
  readFinishes,
  serializeFinishes,
  type FinishMap,
} from "@/lib/expedition/finishes";
import { readProgress } from "@/lib/expedition/progress";
import { assessExpedition } from "@/lib/expedition/trainer-xp";
import type { CardFinishId } from "@/lib/expedition/trainer-rewards";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(FINISH_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(FINISH_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(FINISH_KEY) ?? "";
  } catch {
    return "";
  }
}

function publish(map: FinishMap): void {
  const next = serializeFinishes(map);
  if (next === readRaw()) {
    return;
  }
  window.localStorage.setItem(FINISH_KEY, next);
  window.dispatchEvent(new Event(FINISH_EVENT));
}

export function clearStoredFinishes(): void {
  try {
    window.localStorage.removeItem(FINISH_KEY);
    window.dispatchEvent(new Event(FINISH_EVENT));
  } catch {
    return;
  }
}

function storedContext(): { caught: ReadonlySet<string>; level: number } {
  let progress = readProgress(null);
  try {
    progress = readProgress(window.localStorage.getItem("pokeradar.progress.v1"));
  } catch {
    progress = readProgress(null);
  }
  const report = assessExpedition(progress.caught);
  return {
    caught: progress.caught,
    level: report.complete ? report.progress.level : 1,
  };
}

export function useFinishes(caught: ReadonlySet<string>, level: number): {
  map: FinishMap;
  finishOf: (encounterId: string) => CardFinishId;
  assign: (encounterId: string, finishId: CardFinishId) => void;
} {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const map = hydrated ? readFinishes(raw || null, caught, level) : emptyFinishes();
  const caughtKey = [...caught].sort().join("|");

  useEffect(() => {
    if (!raw) {
      return;
    }
    const parsed = parseFinishes(raw);
    if (!parsed) {
      clearStoredFinishes();
      return;
    }
    const applied = applicableFinishes(parsed, new Set(caughtKey ? caughtKey.split("|") : []), level);
    const next = serializeFinishes(applied);
    if (next !== raw) {
      try {
        window.localStorage.setItem(FINISH_KEY, next);
        window.dispatchEvent(new Event(FINISH_EVENT));
      } catch {
        return;
      }
    }
  }, [caughtKey, level, raw]);

  const assign = useCallback((encounterId: string, finishId: CardFinishId) => {
    const context = storedContext();
    const current = readFinishes(readRaw() || null, context.caught, context.level);
    const next = assignFinish(current, encounterId, finishId, context.caught, context.level);
    if (next === current) {
      return;
    }
    publish(next);
  }, []);

  return {
    map,
    finishOf: (encounterId: string) => finishOf(map, encounterId),
    assign,
  };
}
