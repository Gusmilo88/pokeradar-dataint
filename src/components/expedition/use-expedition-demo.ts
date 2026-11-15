"use client";

import { useCallback, useMemo, useState } from "react";
import {
  completeExpeditionDemo,
  dismissExpeditionCeremony,
  enterExpeditionDemo,
  equipExpeditionDemo,
  exitExpeditionDemo,
  expeditionDemoProgress,
  inactiveExpeditionDemo,
  resetExpeditionDemo,
  type ExpeditionDemoSession,
} from "@/lib/expedition/expedition-demo";
import type { Progress } from "@/lib/expedition/progress";
import type { LevelCeremonyPlan } from "@/lib/expedition/level-ceremony";
import type { CardFinishId } from "@/lib/expedition/trainer-rewards";

export interface ExpeditionDemoController {
  active: boolean;
  caught: ReadonlySet<string>;
  progress: Progress;
  equipped: CardFinishId;
  ceremony: LevelCeremonyPlan | null;
  enter: () => void;
  complete: () => void;
  reset: () => void;
  exit: () => void;
  equip: (id: CardFinishId) => void;
  dismissCeremony: () => void;
}

export function useExpeditionDemo(): ExpeditionDemoController {
  const [session, setSession] = useState<ExpeditionDemoSession>(inactiveExpeditionDemo);
  const progress = useMemo(() => expeditionDemoProgress(session.caught), [session.caught]);
  const enter = useCallback(() => {
    setSession((current) => enterExpeditionDemo(current));
  }, []);
  const complete = useCallback(() => {
    setSession((current) => completeExpeditionDemo(current));
  }, []);
  const reset = useCallback(() => {
    setSession((current) => resetExpeditionDemo(current));
  }, []);
  const exit = useCallback(() => {
    setSession(exitExpeditionDemo());
  }, []);
  const equip = useCallback((id: CardFinishId) => {
    setSession((current) => equipExpeditionDemo(current, id));
  }, []);
  const dismissCeremony = useCallback(() => {
    setSession((current) => dismissExpeditionCeremony(current));
  }, []);

  return {
    active: session.active,
    caught: session.caught,
    progress,
    equipped: session.equipped,
    ceremony: session.ceremony,
    enter,
    complete,
    reset,
    exit,
    equip,
    dismissCeremony,
  };
}
