"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addMember,
  emptyTeam,
  moveMember,
  parseTeam,
  removeMember,
  serializeTeam,
  TEAM_EVENT,
  TEAM_KEY,
} from "@/lib/expedition/team";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(TEAM_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(TEAM_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(TEAM_KEY) ?? "";
  } catch {
    return "";
  }
}

function publish(members: readonly string[]): void {
  window.localStorage.setItem(TEAM_KEY, serializeTeam(members));
  window.dispatchEvent(new Event(TEAM_EVENT));
}

export function clearStoredTeam(): void {
  try {
    window.localStorage.removeItem(TEAM_KEY);
    window.dispatchEvent(new Event(TEAM_EVENT));
  } catch {
    return;
  }
}

export function useTeam(caught: ReadonlySet<string>, hydrated: boolean): {
  members: readonly string[];
  add: (encounterId: string) => void;
  remove: (encounterId: string) => void;
  move: (index: number, delta: -1 | 1) => void;
} {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const parsed = hydrated && raw ? parseTeam(raw, caught) : null;
  const members = hydrated ? (parsed ?? emptyTeam()) : emptyTeam();

  const add = useCallback((encounterId: string) => {
    let caughtNow = new Set<string>();
    try {
      const progress = window.localStorage.getItem("pokeradar.progress.v1");
      if (progress) {
        const value: unknown = JSON.parse(progress);
        if (typeof value === "object" && value && "caught" in value && Array.isArray(value.caught)) {
          caughtNow = new Set(value.caught.filter((item): item is string => typeof item === "string"));
        }
      }
    } catch {
      caughtNow = new Set();
    }
    const current = parseTeam(readRaw(), caughtNow) ?? emptyTeam();
    const next = addMember(current, encounterId, caughtNow);
    if (next.length === current.length && next.every((id, index) => id === current[index])) {
      return;
    }
    publish(next);
  }, []);

  const remove = useCallback((encounterId: string) => {
    const current = parseTeam(readRaw(), new Set(readCaughtIds())) ?? emptyTeam();
    publish(removeMember(current, encounterId));
  }, []);

  const move = useCallback((index: number, delta: -1 | 1) => {
    const current = parseTeam(readRaw(), new Set(readCaughtIds())) ?? emptyTeam();
    publish(moveMember(current, index, delta));
  }, []);

  return { members, add, remove, move };
}

function readCaughtIds(): string[] {
  try {
    const progress = window.localStorage.getItem("pokeradar.progress.v1");
    if (!progress) {
      return [];
    }
    const value: unknown = JSON.parse(progress);
    if (typeof value === "object" && value && "caught" in value && Array.isArray(value.caught)) {
      return value.caught.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return [];
  }
  return [];
}
