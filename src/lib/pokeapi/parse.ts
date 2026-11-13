import { PokeApiError } from "@/lib/pokeapi/errors";
import type {
  NamedApiResource,
  PokemonCries,
  PokemonHabitat,
  PokemonSpecies,
  PokemonSprites,
  PokemonStat,
  PokemonSummary,
  PokemonTypeSlot,
  PokemonVariety,
} from "@/lib/pokeapi/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function fail(label: string): never {
  throw new PokeApiError(`Campo inválido: ${label}.`);
}

function readString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail(label);
  }
  return value;
}

function readNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(label);
  }
  return value;
}

function readNullableString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  return readString(value, label);
}

function readArray(value: unknown, label: string): readonly unknown[] {
  if (!isUnknownArray(value)) {
    fail(label);
  }
  return value;
}

function readResource(value: unknown, label: string): NamedApiResource {
  if (!isRecord(value)) {
    fail(label);
  }
  return {
    name: readString(value.name, `${label}.name`),
    url: readString(value.url, `${label}.url`),
  };
}

function readTypeSlot(value: unknown, index: number): PokemonTypeSlot {
  if (!isRecord(value)) {
    fail(`types[${index}]`);
  }
  return {
    slot: readNumber(value.slot, `types[${index}].slot`),
    type: readResource(value.type, `types[${index}].type`),
  };
}

function readStat(value: unknown, index: number): PokemonStat {
  if (!isRecord(value)) {
    fail(`stats[${index}]`);
  }
  return {
    base_stat: readNumber(value.base_stat, `stats[${index}].base_stat`),
    effort: readNumber(value.effort, `stats[${index}].effort`),
    stat: readResource(value.stat, `stats[${index}].stat`),
  };
}

function readOptionalArtwork(value: unknown, label: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isRecord(value)) {
    fail(label);
  }
  if (value.front_default === undefined) {
    return null;
  }
  return readNullableString(value.front_default, `${label}.front_default`);
}

function readSprites(value: unknown): PokemonSprites {
  if (!isRecord(value)) {
    fail("sprites");
  }

  const other = value.other;
  const artwork =
    other === undefined || other === null
      ? null
      : isRecord(other)
        ? other
        : fail("sprites.other");

  const blackWhite = readBlackWhite(value);

  return {
    front_default: readNullableString(value.front_default, "sprites.front_default"),
    officialArtwork: readOptionalArtwork(
      artwork?.["official-artwork"],
      "sprites.other.official-artwork",
    ),
    showdown: readOptionalArtwork(artwork?.showdown, "sprites.other.showdown"),
    blackWhite: blackWhite.still,
    blackWhiteAnimated: blackWhite.animated,
  };
}

function readBlackWhite(sprites: Record<string, unknown>): {
  still: string | null;
  animated: string | null;
} {
  const versions = sprites.versions;
  if (versions === undefined || versions === null) {
    return { still: null, animated: null };
  }
  if (!isRecord(versions)) {
    fail("sprites.versions");
  }
  const generation = versions["generation-v"];
  if (generation === undefined || generation === null) {
    return { still: null, animated: null };
  }
  if (!isRecord(generation)) {
    fail("sprites.versions.generation-v");
  }
  const blackWhite = generation["black-white"];
  if (blackWhite === undefined || blackWhite === null) {
    return { still: null, animated: null };
  }
  if (!isRecord(blackWhite)) {
    fail("sprites.versions.generation-v.black-white");
  }
  const animated = blackWhite.animated;
  if (animated !== undefined && animated !== null && !isRecord(animated)) {
    fail("sprites.versions.generation-v.black-white.animated");
  }
  return {
    still: readOptionalUrl(blackWhite.front_default, "black-white.front_default"),
    animated:
      animated === undefined || animated === null
        ? null
        : readOptionalUrl(animated.front_default, "black-white.animated.front_default"),
  };
}

function readOptionalUrl(value: unknown, label: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return readString(value, label);
}

function readCries(value: unknown): PokemonCries {
  if (!isRecord(value)) {
    fail("cries");
  }
  return {
    latest: readNullableString(value.latest, "cries.latest"),
    legacy: readNullableString(value.legacy, "cries.legacy"),
  };
}

export function parsePokemon(value: unknown): PokemonSummary {
  if (!isRecord(value)) {
    throw new PokeApiError("La respuesta de Pokémon no es un objeto.");
  }

  const types = readArray(value.types, "types").map((entry, index) =>
    readTypeSlot(entry, index),
  );
  const stats = readArray(value.stats, "stats").map((entry, index) =>
    readStat(entry, index),
  );

  if (types.length === 0) {
    throw new PokeApiError("El Pokémon no trae tipos.");
  }
  if (stats.length === 0) {
    throw new PokeApiError("El Pokémon no trae estadísticas.");
  }

  return {
    id: readNumber(value.id, "id"),
    name: readString(value.name, "name"),
    height: readNumber(value.height, "height"),
    weight: readNumber(value.weight, "weight"),
    types,
    stats,
    sprites: readSprites(value.sprites),
    cries: readCries(value.cries),
  };
}

function readVariety(value: unknown, index: number): PokemonVariety {
  if (!isRecord(value)) {
    fail(`varieties[${index}]`);
  }
  if (typeof value.is_default !== "boolean") {
    fail(`varieties[${index}].is_default`);
  }
  return {
    is_default: value.is_default,
    pokemonName: readResource(value.pokemon, `varieties[${index}].pokemon`).name,
  };
}

function readSpanishName(value: unknown): string | null {
  for (const entry of readArray(value, "names")) {
    if (!isRecord(entry) || !isRecord(entry.language)) {
      fail("names");
    }
    if (entry.language.name === "es") {
      return readString(entry.name, "names.es");
    }
  }
  return null;
}

export function parseSpecies(value: unknown): PokemonSpecies {
  if (!isRecord(value)) {
    throw new PokeApiError("La respuesta de especie no es un objeto.");
  }

  const varieties = readArray(value.varieties, "varieties").map((entry, index) =>
    readVariety(entry, index),
  );
  if (varieties.length === 0) {
    throw new PokeApiError("La especie no trae variedades.");
  }

  return {
    id: readNumber(value.id, "id"),
    name: readString(value.name, "name"),
    spanishName: readSpanishName(value.names),
    varieties,
  };
}

export function parseHabitat(value: unknown): PokemonHabitat {
  if (!isRecord(value)) {
    throw new PokeApiError("La respuesta de hábitat no es un objeto.");
  }

  return {
    id: readNumber(value.id, "id"),
    name: readString(value.name, "name"),
    pokemon_species: readArray(value.pokemon_species, "pokemon_species").map(
      (entry, index) => readResource(entry, `pokemon_species[${index}]`),
    ),
  };
}
