import { TRAINER_LEVEL_CAP } from "@/lib/expedition/trainer-xp";

/**
 * Acabados cosméticos declarados para B8.2 y B8.3.
 * No cambian cartas, estadísticas, tipos ni dificultad.
 * El nivel de desbloqueo es el nivel de expedición, no un contador aparte.
 */
export const COSMETIC_FINISHES = [
  { id: "bronze", label: "Bronce", unlockLevel: 3 },
  { id: "silver", label: "Plata", unlockLevel: 5 },
  { id: "gold", label: "Oro", unlockLevel: 8 },
  { id: "prismatic", label: "Prismático", unlockLevel: 10 },
] as const;

export type CosmeticFinishId = (typeof COSMETIC_FINISHES)[number]["id"];

export interface CosmeticFinish {
  id: CosmeticFinishId;
  label: string;
  unlockLevel: number;
}

export function validateCosmeticFinishes(): readonly string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  let previous = 1;
  for (const finish of COSMETIC_FINISHES) {
    if (ids.has(finish.id)) {
      issues.push(`Acabado repetido: ${finish.id}.`);
    }
    ids.add(finish.id);
    if (!Number.isInteger(finish.unlockLevel) || finish.unlockLevel < 2 || finish.unlockLevel > TRAINER_LEVEL_CAP) {
      issues.push(`El nivel de ${finish.id} queda fuera de 2–${TRAINER_LEVEL_CAP}.`);
    }
    if (finish.unlockLevel <= previous) {
      issues.push(`El nivel de ${finish.id} no crece.`);
    }
    previous = finish.unlockLevel;
  }
  if (!COSMETIC_FINISHES.some((finish) => finish.id === "prismatic" && finish.unlockLevel === TRAINER_LEVEL_CAP)) {
    issues.push("El acabado prismático no está en el nivel máximo.");
  }
  return issues;
}

/** Acabados cuyo nivel ya alcanzó el entrenador. Vacío si el nivel no es válido. */
export function finishesUnlockedAt(level: number): readonly CosmeticFinish[] {
  if (!Number.isInteger(level) || level < 1 || level > TRAINER_LEVEL_CAP) {
    return [];
  }
  return COSMETIC_FINISHES.filter((finish) => finish.unlockLevel <= level);
}

/**
 * Cinco acabados de carta. Base es la apariencia actual y está desde el nivel 1.
 * Los otros cuatro son los metales ya declarados. Ninguno cambia tipo ni poder.
 */
export const CARD_FINISHES = [
  { id: "base", label: "Base", unlockLevel: 1, note: "Marco de la expedición, sin metal añadido." },
  { id: "bronze", label: "Bronce", unlockLevel: 3, note: "Marco pulido y reflejo cálido." },
  { id: "silver", label: "Plata", unlockLevel: 5, note: "Marco frío y brillo contenido." },
  { id: "gold", label: "Oro", unlockLevel: 8, note: "Marco intenso de carta premium." },
  { id: "prismatic", label: "Prismático", unlockLevel: 10, note: "Reflejo iridiscente, solo en el marco." },
] as const;

export type CardFinishId = (typeof CARD_FINISHES)[number]["id"];

export interface CardFinish {
  id: CardFinishId;
  label: string;
  unlockLevel: number;
  note: string;
}

/** Un título por nivel. Identidad de campo, no de gimnasio. */
export const TRAINER_RANKS = [
  { level: 1, title: "Viajero" },
  { level: 2, title: "Rastreador" },
  { level: 3, title: "Naturalista" },
  { level: 4, title: "Topógrafo" },
  { level: 5, title: "Cartógrafo" },
  { level: 6, title: "Guardaparque" },
  { level: 7, title: "Expedicionario" },
  { level: 8, title: "Archivero" },
  { level: 9, title: "Custodio" },
  { level: 10, title: "Cronista" },
] as const;

export function rankForLevel(level: number): string | null {
  const rank = TRAINER_RANKS.find((item) => item.level === level);
  return rank?.title ?? null;
}

export function cardFinish(id: string): CardFinish | null {
  const finish = CARD_FINISHES.find((item) => item.id === id);
  return finish ?? null;
}

export function finishUnlocked(id: CardFinishId, level: number): boolean {
  const finish = cardFinish(id);
  if (!finish || !Number.isInteger(level) || level < 1 || level > TRAINER_LEVEL_CAP) {
    return false;
  }
  return level >= finish.unlockLevel;
}

/** Base y los metales cuyo nivel ya alcanzó el entrenador. */
export function equipableFinishes(level: number): readonly CardFinish[] {
  return CARD_FINISHES.filter((finish) => finishUnlocked(finish.id, level));
}

/** Metal del sello del perfil. Sigue al nivel, no es una estadística nueva. */
export function plateForLevel(level: number): CardFinishId {
  if (level >= 10) {
    return "prismatic";
  }
  if (level >= 8) {
    return "gold";
  }
  if (level >= 5) {
    return "silver";
  }
  if (level >= 3) {
    return "bronze";
  }
  return "base";
}
