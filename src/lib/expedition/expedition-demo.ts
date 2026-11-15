import { KANTO_CATALOG, EXPEDITION_SIZE } from "@/lib/expedition/kanto";
import { describeLevelRise, type LevelCeremonyPlan } from "@/lib/expedition/level-ceremony";
import type { Progress } from "@/lib/expedition/progress";
import { assessExpedition } from "@/lib/expedition/trainer-xp";
import { TRAINER_XP_CATALOG } from "@/lib/expedition/trainer-xp-catalog";
import { finishUnlocked, type CardFinishId } from "@/lib/expedition/trainer-rewards";

/**
 * Expedición de prueba. El conjunto vive en memoria y se descarta al salir.
 * No publica capturas, acabados ni equipo.
 */
export interface ExpeditionDemoSession {
  active: boolean;
  caught: ReadonlySet<string>;
  equipped: CardFinishId;
  ceremony: LevelCeremonyPlan | null;
  celebrated: boolean;
}

const CATALOG_IDS = KANTO_CATALOG.map((entry) => entry.encounterId);

export function inactiveExpeditionDemo(): ExpeditionDemoSession {
  return {
    active: false,
    caught: new Set(),
    equipped: "base",
    ceremony: null,
    celebrated: false,
  };
}

export function expeditionDemoProgress(caught: ReadonlySet<string>): Progress {
  return { seen: caught, caught };
}

export function enterExpeditionDemo(session: ExpeditionDemoSession): ExpeditionDemoSession {
  if (session.active) {
    return session;
  }
  return { ...inactiveExpeditionDemo(), active: true };
}

export function completeExpeditionDemo(session: ExpeditionDemoSession): ExpeditionDemoSession {
  if (!session.active || session.caught.size >= EXPEDITION_SIZE) {
    return session;
  }
  const before = assessExpedition(session.caught);
  const caught = new Set(CATALOG_IDS);
  const after = assessExpedition(caught);
  if (!after.complete) {
    return session;
  }
  const fromLevel = before.complete ? before.progress.level : 1;
  let ceremony = session.ceremony;
  let celebrated = session.celebrated;
  if (!celebrated && after.progress.level > fromLevel) {
    const described = describeLevelRise(fromLevel, after.progress.level, specimenOf(caught));
    if (described) {
      ceremony = { ...described, id: `expedicion-${fromLevel}-${after.progress.level}` };
      celebrated = true;
    }
  }
  const equipped = finishUnlocked(session.equipped, after.progress.level) ? session.equipped : "base";
  return { active: true, caught, equipped, ceremony, celebrated };
}

export function resetExpeditionDemo(session: ExpeditionDemoSession): ExpeditionDemoSession {
  if (!session.active) {
    return session;
  }
  return { ...inactiveExpeditionDemo(), active: true };
}

export function exitExpeditionDemo(): ExpeditionDemoSession {
  return inactiveExpeditionDemo();
}

export function dismissExpeditionCeremony(session: ExpeditionDemoSession): ExpeditionDemoSession {
  if (!session.ceremony) {
    return session;
  }
  return { ...session, ceremony: null };
}

export function equipExpeditionDemo(
  session: ExpeditionDemoSession,
  id: CardFinishId,
): ExpeditionDemoSession {
  if (!session.active || session.equipped === id) {
    return session;
  }
  const report = assessExpedition(session.caught);
  const level = report.complete ? report.progress.level : 1;
  if (!finishUnlocked(id, level)) {
    return session;
  }
  return { ...session, equipped: id };
}

function specimenOf(caught: ReadonlySet<string>): string | null {
  let best: { id: string; xp: number } | null = null;
  for (const row of TRAINER_XP_CATALOG) {
    if (!caught.has(row.encounterId)) {
      continue;
    }
    if (!best || row.baseExperience > best.xp) {
      best = { id: row.encounterId, xp: row.baseExperience };
    }
  }
  return best?.id ?? null;
}
