/**
 * Subconjunto leído de PokéAPI. No es el recurso completo.
 * Contraste el 2026-11-13 contra:
 * - GET /pokemon/25
 * - GET /pokemon-habitat (los nueve slugs)
 * - GET /pokemon-habitat/forest
 * Si un campo falta o cambia de tipo, el parser falla: no se completa con datos inventados.
 */

export const POKEMON_HABITATS = [
  "cave",
  "forest",
  "grassland",
  "mountain",
  "rare",
  "rough-terrain",
  "sea",
  "urban",
  "waters-edge",
] as const;

export type PokemonHabitatName = (typeof POKEMON_HABITATS)[number];

export interface NamedApiResource {
  name: string;
  url: string;
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedApiResource;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedApiResource;
}

export interface PokemonSprites {
  front_default: string | null;
  officialArtwork: string | null;
  showdown: string | null;
}

export interface PokemonCries {
  latest: string | null;
  legacy: string | null;
}

export interface PokemonSummary {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  sprites: PokemonSprites;
  cries: PokemonCries;
}

export interface PokemonHabitat {
  id: number;
  name: string;
  pokemon_species: NamedApiResource[];
}

export interface PokemonVariety {
  is_default: boolean;
  pokemonName: string;
}

/**
 * Subconjunto de /pokemon-species/{name}.
 * El hábitat lista especies. La ficha jugable sale de la variedad por defecto.
 */
export interface PokemonSpecies {
  id: number;
  name: string;
  spanishName: string | null;
  varieties: PokemonVariety[];
}
