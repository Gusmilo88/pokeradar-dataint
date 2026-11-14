"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { clearStoredTeam } from "@/components/expedition/use-team";
import {
  emptyProgress,
  markCaught,
  markSeen,
  parseProgress,
  PROGRESS_EVENT,
  PROGRESS_KEY,
  readProgress,
  serializeProgress,
  type Progress,
} from "@/lib/expedition/progress";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(PROGRESS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(PROGRESS_KEY) ?? "";
  } catch {
    return "";
  }
}

function publish(raw: string): void {
  window.localStorage.setItem(PROGRESS_KEY, raw);
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function useProgress(): {
  progress: Progress;
  hydrated: boolean;
  markSeen: (encounterId: string) => void;
  markCaught: (encounterId: string) => void;
  reset: () => void;
} {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const progress = raw ? (parseProgress(raw) ?? emptyProgress()) : readProgress(null);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!raw || parseProgress(raw)) {
      return;
    }
    try {
      window.localStorage.removeItem(PROGRESS_KEY);
      window.dispatchEvent(new Event(PROGRESS_EVENT));
    } catch {
      return;
    }
  }, [raw]);

  const reveal = useCallback((encounterId: string) => {
    let current = emptyProgress();
    try {
      current = readProgress(window.localStorage.getItem(PROGRESS_KEY));
    } catch {
      current = emptyProgress();
    }
    const next = markSeen(current, encounterId);
    if (next === current) {
      return;
    }
    publish(serializeProgress(next));
  }, []);

  const capture = useCallback((encounterId: string) => {
    let current = emptyProgress();
    try {
      current = readProgress(window.localStorage.getItem(PROGRESS_KEY));
    } catch {
      current = emptyProgress();
    }
    const next = markCaught(current, encounterId);
    if (next === current) {
      return;
    }
    publish(serializeProgress(next));
  }, []);

  const reset = useCallback(() => {
    publish(serializeProgress(emptyProgress()));
    clearStoredTeam();
  }, []);

  return { progress, hydrated, markSeen: reveal, markCaught: capture, reset };
}
