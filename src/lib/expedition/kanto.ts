import type { ExpeditionHabitat } from "@/lib/expedition/argentina";

/**
 * Expedición Kanto: 56 especies de la Pokédex Nacional 1–151.
 * Los números de expedición y los ids están escritos en cada ficha.
 * No salen de la posición del array.
 *
 * Regla de campo: la especie usa el hábitat que PokéAPI publica para esa zona.
 * Regla de reserva: Articuno, Zapdos, Moltres, Aerodactyl, Mewtwo y Mew no se
 * colocan como encuentros. Cinco tienen hábitat `rare`, que no es una zona.
 * Aerodactyl es `mountain`, pero queda reservado igual: el hábitat no lo vuelve un encuentro común.
 */
export type EncounterRole = "field" | "reserved";

export type CatalogHabitat = ExpeditionHabitat | "rare";

export interface CatalogEntry {
  encounterId: string;
  nationalId: number;
  expeditionNumber: number;
  speciesName: string;
  role: EncounterRole;
  zoneId: string | null;
  habitat: CatalogHabitat;
}

export const EXPEDITION_SIZE = 56;
export const FIELD_ENCOUNTERS = 50;

const RESERVED_IDS = [144, 145, 146, 142, 150, 151] as const;

export const RESERVED_NATIONAL_IDS: readonly number[] = RESERVED_IDS;

function entry(
  expeditionNumber: number,
  nationalId: number,
  speciesName: string,
  role: EncounterRole,
  zoneId: string | null,
  habitat: CatalogHabitat,
): CatalogEntry {
  return {
    encounterId: `kanto-${String(nationalId).padStart(3, "0")}`,
    nationalId,
    expeditionNumber,
    speciesName,
    role,
    zoneId,
    habitat,
  };
}

function field(
  expeditionNumber: number,
  nationalId: number,
  speciesName: string,
  zoneId: string,
  habitat: ExpeditionHabitat,
): CatalogEntry {
  return entry(expeditionNumber, nationalId, speciesName, "field", zoneId, habitat);
}

function reserved(
  expeditionNumber: number,
  nationalId: number,
  speciesName: string,
  habitat: CatalogHabitat,
): CatalogEntry {
  return entry(expeditionNumber, nationalId, speciesName, "reserved", null, habitat);
}

export const KANTO_CATALOG: readonly CatalogEntry[] = [
  field(1, 52, "meowth", "buenos-aires", "urban"),
  field(2, 133, "eevee", "buenos-aires", "urban"),
  field(3, 132, "ditto", "buenos-aires", "urban"),
  field(4, 100, "voltorb", "buenos-aires", "urban"),
  field(5, 109, "koffing", "buenos-aires", "urban"),

  field(6, 25, "pikachu", "puerto-iguazu", "forest"),
  field(7, 12, "butterfree", "puerto-iguazu", "forest"),
  field(8, 18, "pidgeot", "puerto-iguazu", "forest"),
  field(9, 15, "beedrill", "puerto-iguazu", "forest"),
  field(10, 103, "exeggutor", "puerto-iguazu", "forest"),
  field(11, 127, "pinsir", "puerto-iguazu", "forest"),
  field(12, 69, "bellsprout", "puerto-iguazu", "forest"),

  field(13, 7, "squirtle", "cataratas-iguazu", "waters-edge"),
  field(14, 54, "psyduck", "cataratas-iguazu", "waters-edge"),
  field(15, 129, "magikarp", "cataratas-iguazu", "waters-edge"),
  field(16, 130, "gyarados", "cataratas-iguazu", "waters-edge"),

  field(17, 1, "bulbasaur", "ibera", "grassland"),
  field(18, 128, "tauros", "ibera", "grassland"),
  field(19, 58, "growlithe", "ibera", "grassland"),
  field(20, 125, "electabuzz", "ibera", "grassland"),
  field(21, 123, "scyther", "ibera", "grassland"),

  field(22, 4, "charmander", "aconcagua", "mountain"),
  field(23, 74, "geodude", "aconcagua", "mountain"),
  field(24, 66, "machop", "aconcagua", "mountain"),
  field(25, 104, "cubone", "aconcagua", "mountain"),
  field(26, 143, "snorlax", "aconcagua", "mountain"),

  field(27, 6, "charizard", "perito-moreno", "mountain"),
  field(28, 76, "golem", "perito-moreno", "mountain"),
  field(29, 68, "machamp", "perito-moreno", "mountain"),
  field(30, 105, "marowak", "perito-moreno", "mountain"),
  field(31, 36, "clefable", "perito-moreno", "mountain"),

  field(32, 131, "lapras", "puerto-piramides", "sea"),
  field(33, 87, "dewgong", "puerto-piramides", "sea"),
  field(34, 73, "tentacruel", "puerto-piramides", "sea"),
  field(35, 121, "starmie", "puerto-piramides", "sea"),

  field(36, 27, "sandshrew", "puna", "rough-terrain"),
  field(37, 22, "fearow", "puna", "rough-terrain"),
  field(38, 81, "magnemite", "puna", "rough-terrain"),
  field(39, 111, "rhyhorn", "puna", "rough-terrain"),
  field(40, 21, "spearow", "puna", "rough-terrain"),

  field(41, 94, "gengar", "caverna-brujas", "cave"),
  field(42, 95, "onix", "caverna-brujas", "cave"),
  field(43, 42, "golbat", "caverna-brujas", "cave"),
  field(44, 50, "diglett", "caverna-brujas", "cave"),

  field(45, 9, "blastoise", "mar-del-plata", "waters-edge"),
  field(46, 98, "krabby", "mar-del-plata", "waters-edge"),
  field(47, 79, "slowpoke", "mar-del-plata", "waters-edge"),
  field(48, 118, "goldeen", "mar-del-plata", "waters-edge"),
  field(49, 149, "dragonite", "mar-del-plata", "waters-edge"),
  field(50, 61, "poliwhirl", "mar-del-plata", "waters-edge"),

  reserved(51, 144, "articuno", "rare"),
  reserved(52, 145, "zapdos", "rare"),
  reserved(53, 146, "moltres", "rare"),
  reserved(54, 142, "aerodactyl", "mountain"),
  reserved(55, 150, "mewtwo", "rare"),
  reserved(56, 151, "mew", "rare"),
];
