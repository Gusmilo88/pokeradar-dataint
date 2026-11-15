import { TRAINER_XP_CATALOG } from "@/lib/expedition/trainer-xp-catalog";
import { assessExpedition, TRAINER_LEVEL_CAP } from "@/lib/expedition/trainer-xp";
import {
  CARD_FINISHES,
  rankForLevel,
  type CardFinish,
} from "@/lib/expedition/trainer-rewards";

/**
 * Ceremonia de nivel. La XP sigue saliendo de los ids capturados.
 * Esta sesión solo recuerda, en memoria, qué salto ya se anunció.
 */
export type LevelCeremonyIntensity = "rise" | "reward" | "gold" | "diamond";

export interface LevelCeremonyPlan {
  id: string;
  fromLevel: number;
  toLevel: number;
  rank: string;
  reached: readonly number[];
  reachedLabel: string;
  rewards: readonly CardFinish[];
  phrase: string;
  specimenId: string | null;
  intensity: LevelCeremonyIntensity;
}

export interface LevelCeremonySession {
  caughtKey: string | null;
  stamp: number;
  queue: readonly LevelCeremonyPlan[];
}

const EMPTY_QUEUE: readonly LevelCeremonyPlan[] = [];

export function emptyLevelSession(): LevelCeremonySession {
  return { caughtKey: null, stamp: 0, queue: EMPTY_QUEUE };
}

export function caughtKeyOf(caught: ReadonlySet<string>): string {
  return [...caught].sort().join("|");
}

export function formatReached(levels: readonly number[]): string {
  if (levels.length === 0) {
    return "";
  }
  if (levels.length === 1) {
    const only = levels[0];
    return only === undefined ? "" : `Nivel ${only}`;
  }
  if (levels.length === 2) {
    return `Niveles ${levels[0]} y ${levels[1]}`;
  }
  const last = levels[levels.length - 1];
  return `Niveles ${levels.slice(0, -1).join(", ")} y ${last}`;
}

function phraseFor(toLevel: number, rewardCount: number): string {
  if (toLevel >= TRAINER_LEVEL_CAP) {
    return "La expedición alcanza su crónica.";
  }
  if (rewardCount > 1) {
    return "Este salto deja varios acabados listos.";
  }
  if (rewardCount === 1) {
    return "Un acabado nuevo espera en tu perfil.";
  }
  return "La ruta se afirma un poco más.";
}

export function intensityFor(rewards: readonly CardFinish[]): LevelCeremonyIntensity {
  if (rewards.some((finish) => finish.id === "diamond")) {
    return "diamond";
  }
  if (rewards.some((finish) => finish.id === "gold")) {
    return "gold";
  }
  if (rewards.length > 0) {
    return "reward";
  }
  return "rise";
}

/** Un solo anuncio del nivel final, con cada acabado cruzado en el salto. */
export function describeLevelRise(
  fromLevel: number,
  toLevel: number,
  specimenId: string | null,
): Omit<LevelCeremonyPlan, "id"> | null {
  if (!Number.isInteger(fromLevel) || !Number.isInteger(toLevel)) {
    return null;
  }
  if (fromLevel < 1 || toLevel > TRAINER_LEVEL_CAP || toLevel <= fromLevel) {
    return null;
  }
  const rank = rankForLevel(toLevel);
  if (!rank) {
    return null;
  }
  const reached: number[] = [];
  for (let level = fromLevel + 1; level <= toLevel; level += 1) {
    reached.push(level);
  }
  const rewards = CARD_FINISHES.filter(
    (finish) => finish.id !== "base" && finish.unlockLevel > fromLevel && finish.unlockLevel <= toLevel,
  );
  return {
    fromLevel,
    toLevel,
    rank,
    reached,
    reachedLabel: formatReached(reached),
    rewards,
    phrase: phraseFor(toLevel, rewards.length),
    specimenId,
    intensity: intensityFor(rewards),
  };
}

function idsOf(key: string): Set<string> {
  return new Set(key.length === 0 ? [] : key.split("|"));
}

function specimenOf(added: readonly string[]): string | null {
  let best: { id: string; xp: number } | null = null;
  for (const id of added) {
    const row = TRAINER_XP_CATALOG.find((entry) => entry.encounterId === id);
    if (!row) {
      continue;
    }
    if (!best || row.baseExperience > best.xp || (row.baseExperience === best.xp && id < best.id)) {
      best = { id, xp: row.baseExperience };
    }
  }
  return best?.id ?? null;
}

/**
 * La primera observación adopta el nivel ya guardado y no celebra.
 * Un salto posterior entra una sola vez en la cola. Reiniciar la vacía.
 */
export function noteCaught(
  session: LevelCeremonySession,
  caught: ReadonlySet<string>,
): LevelCeremonySession {
  const key = caughtKeyOf(caught);
  if (session.caughtKey === null) {
    return { caughtKey: key, stamp: session.stamp, queue: EMPTY_QUEUE };
  }
  if (session.caughtKey === key) {
    return session;
  }
  const previous = idsOf(session.caughtKey);
  const removed = [...previous].filter((id) => !caught.has(id));
  if (removed.length > 0) {
    return { caughtKey: key, stamp: session.stamp, queue: EMPTY_QUEUE };
  }
  const before = assessExpedition(previous);
  const after = assessExpedition(caught);
  if (!before.complete || !after.complete || after.progress.level <= before.progress.level) {
    return { caughtKey: key, stamp: session.stamp, queue: session.queue };
  }
  const added = [...caught].filter((id) => !previous.has(id));
  const described = describeLevelRise(
    before.progress.level,
    after.progress.level,
    specimenOf(added),
  );
  if (!described) {
    return { caughtKey: key, stamp: session.stamp, queue: session.queue };
  }
  const stamp = session.stamp + 1;
  const plan: LevelCeremonyPlan = { ...described, id: `nivel-${stamp}` };
  return { caughtKey: key, stamp, queue: [...session.queue, plan] };
}

export function dismissLevelCeremony(session: LevelCeremonySession): LevelCeremonySession {
  if (session.queue.length === 0) {
    return session;
  }
  return { ...session, queue: session.queue.slice(1) };
}

export function skipLevelCeremonies(session: LevelCeremonySession): LevelCeremonySession {
  if (session.queue.length === 0) {
    return session;
  }
  return { ...session, queue: EMPTY_QUEUE };
}
