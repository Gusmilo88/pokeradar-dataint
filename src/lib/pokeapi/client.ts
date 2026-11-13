import { remember } from "@/lib/pokeapi/cache";
import { PokeApiError } from "@/lib/pokeapi/errors";
import { parseHabitat, parsePokemon, parseSpecies } from "@/lib/pokeapi/parse";
import { defaultVarietyName } from "@/lib/pokeapi/species";
import type {
  PokemonHabitat,
  PokemonHabitatName,
  PokemonSpecies,
  PokemonSummary,
} from "@/lib/pokeapi/types";

export const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

function asUnknown(value: unknown): unknown {
  return value;
}

async function getJson(path: string): Promise<unknown> {
  const url = `${POKEAPI_BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new PokeApiError("No se pudo contactar a PokéAPI.");
  }

  if (!response.ok) {
    throw new PokeApiError(
      `PokéAPI respondió ${response.status} para ${path}.`,
      response.status,
    );
  }

  return asUnknown(await response.json());
}

function pokemonPath(idOrName: number | string): string {
  if (typeof idOrName === "number") {
    if (!Number.isInteger(idOrName) || idOrName < 1) {
      throw new PokeApiError("El id de Pokémon debe ser un entero positivo.");
    }
    return `/pokemon/${idOrName}`;
  }

  const name = idOrName.trim();
  if (name.length === 0) {
    throw new PokeApiError("El nombre de Pokémon está vacío.");
  }

  return `/pokemon/${encodeURIComponent(name)}`;
}

export async function getPokemon(idOrName: number | string): Promise<PokemonSummary> {
  const path = pokemonPath(idOrName);
  return remember(`pokemon:${path}`, async () => parsePokemon(await getJson(path)));
}

export async function getSpecies(name: string): Promise<PokemonSpecies> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new PokeApiError("El nombre de especie está vacío.");
  }
  const path = `/pokemon-species/${encodeURIComponent(trimmed)}`;
  return remember(`species:${path}`, async () => parseSpecies(await getJson(path)));
}

export async function getHabitat(name: PokemonHabitatName): Promise<PokemonHabitat> {
  return remember(`habitat:${name}`, async () =>
    parseHabitat(await getJson(`/pokemon-habitat/${name}`)),
  );
}

export async function getPokemonForSpecies(speciesName: string): Promise<{
  species: PokemonSpecies;
  pokemon: PokemonSummary;
}> {
  const species = await getSpecies(speciesName);
  const pokemon = await getPokemon(defaultVarietyName(species));
  return { species, pokemon };
}
