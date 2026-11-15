/**
 * XP de expedición de las 56 especies de KANTO_CATALOG.
 *
 * Procedencia: el entero `base_experience` de
 * GET https://pokeapi.co/api/v2/pokemon/{nationalId}
 * leído el 2026-11-14. No se estimó ni se completó ningún valor.
 *
 * Esto no es la experiencia de los videojuegos. Esa fórmula multiplica
 * `base_experience` por el nivel del Pokémon, el entrenador y el combate.
 * Aquí el entero publicado se otorga una sola vez, al capturar.
 *
 * Actualización: volver a leer `base_experience` de cada id nacional del
 * catálogo de expedición, reemplazar esta tabla y correr
 * `npx tsx scripts/verify-trainer-xp.ts`. Ese script contrasta la API y
 * rechaza la tabla si falta una ficha, si el entero no coincide o si el
 * total deja de cerrar la curva.
 */

export const TRAINER_XP_CATALOG_VERSION = 1;

export const TRAINER_XP_SOURCE = "https://pokeapi.co/api/v2/pokemon/{id}";

export const TRAINER_XP_RETRIEVED_ON = "2026-11-14";

export interface TrainerXpEntry {
  encounterId: string;
  nationalId: number;
  /** Entero `base_experience` publicado por PokéAPI. */
  baseExperience: number;
}

export const TRAINER_XP_CATALOG: readonly TrainerXpEntry[] = [
  { encounterId: "kanto-052", nationalId: 52, baseExperience: 58 },
  { encounterId: "kanto-133", nationalId: 133, baseExperience: 65 },
  { encounterId: "kanto-132", nationalId: 132, baseExperience: 101 },
  { encounterId: "kanto-100", nationalId: 100, baseExperience: 66 },
  { encounterId: "kanto-109", nationalId: 109, baseExperience: 68 },
  { encounterId: "kanto-025", nationalId: 25, baseExperience: 112 },
  { encounterId: "kanto-012", nationalId: 12, baseExperience: 178 },
  { encounterId: "kanto-018", nationalId: 18, baseExperience: 216 },
  { encounterId: "kanto-015", nationalId: 15, baseExperience: 178 },
  { encounterId: "kanto-103", nationalId: 103, baseExperience: 186 },
  { encounterId: "kanto-127", nationalId: 127, baseExperience: 175 },
  { encounterId: "kanto-069", nationalId: 69, baseExperience: 60 },
  { encounterId: "kanto-007", nationalId: 7, baseExperience: 63 },
  { encounterId: "kanto-054", nationalId: 54, baseExperience: 64 },
  { encounterId: "kanto-129", nationalId: 129, baseExperience: 40 },
  { encounterId: "kanto-130", nationalId: 130, baseExperience: 189 },
  { encounterId: "kanto-001", nationalId: 1, baseExperience: 64 },
  { encounterId: "kanto-128", nationalId: 128, baseExperience: 172 },
  { encounterId: "kanto-058", nationalId: 58, baseExperience: 70 },
  { encounterId: "kanto-125", nationalId: 125, baseExperience: 172 },
  { encounterId: "kanto-123", nationalId: 123, baseExperience: 100 },
  { encounterId: "kanto-004", nationalId: 4, baseExperience: 62 },
  { encounterId: "kanto-074", nationalId: 74, baseExperience: 60 },
  { encounterId: "kanto-066", nationalId: 66, baseExperience: 61 },
  { encounterId: "kanto-104", nationalId: 104, baseExperience: 64 },
  { encounterId: "kanto-143", nationalId: 143, baseExperience: 189 },
  { encounterId: "kanto-006", nationalId: 6, baseExperience: 240 },
  { encounterId: "kanto-076", nationalId: 76, baseExperience: 223 },
  { encounterId: "kanto-068", nationalId: 68, baseExperience: 227 },
  { encounterId: "kanto-105", nationalId: 105, baseExperience: 149 },
  { encounterId: "kanto-036", nationalId: 36, baseExperience: 217 },
  { encounterId: "kanto-131", nationalId: 131, baseExperience: 187 },
  { encounterId: "kanto-087", nationalId: 87, baseExperience: 166 },
  { encounterId: "kanto-073", nationalId: 73, baseExperience: 180 },
  { encounterId: "kanto-121", nationalId: 121, baseExperience: 182 },
  { encounterId: "kanto-027", nationalId: 27, baseExperience: 60 },
  { encounterId: "kanto-022", nationalId: 22, baseExperience: 155 },
  { encounterId: "kanto-081", nationalId: 81, baseExperience: 65 },
  { encounterId: "kanto-111", nationalId: 111, baseExperience: 69 },
  { encounterId: "kanto-021", nationalId: 21, baseExperience: 52 },
  { encounterId: "kanto-094", nationalId: 94, baseExperience: 225 },
  { encounterId: "kanto-095", nationalId: 95, baseExperience: 77 },
  { encounterId: "kanto-042", nationalId: 42, baseExperience: 159 },
  { encounterId: "kanto-050", nationalId: 50, baseExperience: 53 },
  { encounterId: "kanto-009", nationalId: 9, baseExperience: 239 },
  { encounterId: "kanto-098", nationalId: 98, baseExperience: 65 },
  { encounterId: "kanto-079", nationalId: 79, baseExperience: 63 },
  { encounterId: "kanto-118", nationalId: 118, baseExperience: 64 },
  { encounterId: "kanto-149", nationalId: 149, baseExperience: 270 },
  { encounterId: "kanto-061", nationalId: 61, baseExperience: 135 },
  { encounterId: "kanto-144", nationalId: 144, baseExperience: 261 },
  { encounterId: "kanto-145", nationalId: 145, baseExperience: 261 },
  { encounterId: "kanto-146", nationalId: 146, baseExperience: 261 },
  { encounterId: "kanto-142", nationalId: 142, baseExperience: 180 },
  { encounterId: "kanto-150", nationalId: 150, baseExperience: 306 },
  { encounterId: "kanto-151", nationalId: 151, baseExperience: 270 },
];
