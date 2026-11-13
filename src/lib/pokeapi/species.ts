import { PokeApiError } from "@/lib/pokeapi/errors";
import type { PokemonSpecies } from "@/lib/pokeapi/types";

export function defaultVarietyName(species: PokemonSpecies): string {
  const preferred = species.varieties.find((variety) => variety.is_default);
  const name = preferred?.pokemonName ?? species.varieties[0]?.pokemonName;
  if (!name) {
    throw new PokeApiError(`La especie ${species.name} no trae variedades.`);
  }
  return name;
}
