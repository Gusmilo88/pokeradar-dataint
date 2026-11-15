"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  equippedFinish,
  equipFinish,
  FINISH_EVENT,
  FINISH_KEY,
  FINISH_KEY_V1,
  parseEquipped,
  serializeFinish,
} from "@/lib/expedition/finishes";
import { readProgress } from "@/lib/expedition/progress";
import { assessExpedition } from "@/lib/expedition/trainer-xp";
import { finishUnlocked, type CardFinishId } from "@/lib/expedition/trainer-rewards";

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

function publish(id: CardFinishId): void {
  const next = serializeFinish(id);
  if (next === readRaw()) {
    return;
  }
  window.localStorage.setItem(FINISH_KEY, next);
  window.dispatchEvent(new Event(FINISH_EVENT));
}

export function clearStoredFinishes(): void {
  try {
    window.localStorage.removeItem(FINISH_KEY);
    window.localStorage.removeItem(FINISH_KEY_V1);
    window.dispatchEvent(new Event(FINISH_EVENT));
  } catch {
    return;
  }
}

function storedLevel(): number {
  let progress = readProgress(null);
  try {
    progress = readProgress(window.localStorage.getItem("pokeradar.progress.v1"));
  } catch {
    progress = readProgress(null);
  }
  const report = assessExpedition(progress.caught);
  return report.complete ? report.progress.level : 1;
}

export function useFinishes(level: number): {
  equipped: CardFinishId;
  equip: (finishId: CardFinishId) => void;
} {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const equipped = equippedFinish(raw || null, level);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(FINISH_KEY_V1) !== null) {
        window.localStorage.removeItem(FINISH_KEY_V1);
        window.dispatchEvent(new Event(FINISH_EVENT));
      }
    } catch {
      return;
    }
    if (!raw) {
      return;
    }
    const parsed = parseEquipped(raw);
    if (!parsed || parsed === "legacy") {
      try {
        window.localStorage.removeItem(FINISH_KEY);
        window.dispatchEvent(new Event(FINISH_EVENT));
      } catch {
        return;
      }
      return;
    }
    if (!finishUnlocked(parsed, level)) {
      publish("base");
      return;
    }
    if (raw.includes('"prismatic"')) {
      publish("diamond");
    }
  }, [level, raw]);

  const equip = useCallback((finishId: CardFinishId) => {
    const currentLevel = storedLevel();
    const current = equippedFinish(readRaw() || null, currentLevel);
    const next = equipFinish(current, finishId, currentLevel);
    if (next === current) {
      return;
    }
    publish(next);
  }, []);

  return { equipped, equip };
}
