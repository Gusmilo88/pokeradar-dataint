import { EXPEDITION_ZONES } from "../src/lib/expedition/argentina";
import { DISCOVERY_STATES, undiscovered } from "../src/lib/expedition/discovery";
import { containsBounds, isEastOfChile } from "../src/lib/expedition/geography";
import {
  EXPEDITION_SIZE,
  FIELD_ENCOUNTERS,
  KANTO_CATALOG,
  RESERVED_NATIONAL_IDS,
} from "../src/lib/expedition/kanto";
import { separateZoneOffsets } from "../src/lib/expedition/pins";
import { buildFieldSightings, findSighting, TARGET_ENCOUNTERS } from "../src/lib/expedition/sightings";
import { getHabitat, getPokemon, getPokemonForSpecies } from "../src/lib/pokeapi/client";
import { parsePokemon } from "../src/lib/pokeapi/parse";
import { POKEMON_HABITATS, type PokemonHabitatName } from "../src/lib/pokeapi/types";

async function main(): Promise<void> {
  const pikachu = await getPokemon(25);
  const typeNames = pikachu.types.map((slot) => slot.type.name);
  const statNames = pikachu.stats.map((stat) => stat.stat.name);

  if (pikachu.name !== "pikachu" || !typeNames.includes("electric")) {
    throw new Error(
      `Pikachu no coincide con la API: ${pikachu.name} [${typeNames.join(", ")}]`,
    );
  }

  if (!statNames.includes("hp") || pikachu.sprites.front_default === null) {
    throw new Error("La ficha de Pikachu llegó sin HP o sin sprite frontal.");
  }

  let rejected = false;
  try {
    parsePokemon({ id: "no" });
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error("El parser aceptó un objeto que no es un Pokémon.");
  }

  const wormadam = await getPokemonForSpecies("wormadam");
  if (wormadam.species.name !== "wormadam" || wormadam.species.id !== 413) {
    throw new Error(
      `La especie Wormadam no coincide: ${wormadam.species.name} ${wormadam.species.id}`,
    );
  }
  if (wormadam.pokemon.name !== "wormadam-plant") {
    throw new Error(
      `La variedad por defecto de Wormadam no es plant: ${wormadam.pokemon.name}`,
    );
  }

  const pikachuSpecies = await getPokemonForSpecies("pikachu");
  if (pikachuSpecies.pokemon.name !== "pikachu") {
    throw new Error(
      `La variedad por defecto de Pikachu cambió: ${pikachuSpecies.pokemon.name}`,
    );
  }

  let forestSpecies = 0;

  for (const habitat of POKEMON_HABITATS) {
    const result = await getHabitat(habitat);
    if (result.name !== habitat) {
      throw new Error(`El hábitat ${habitat} respondió como ${result.name}.`);
    }
    if (habitat === "forest") {
      forestSpecies = result.pokemon_species.length;
    }
  }

  if (forestSpecies === 0) {
    throw new Error("El hábitat forest no trajo especies.");
  }

  for (const zone of EXPEDITION_ZONES) {
    const { latitude, longitude } = zone.anchor;
    const inside =
      latitude <= -21.5 &&
      latitude >= -55.2 &&
      longitude <= -53.5 &&
      longitude >= -73.7;

    if (!inside) {
      throw new Error(`La zona ${zone.id} quedó fuera del recuadro de Argentina.`);
    }

    const habitat: PokemonHabitatName = zone.habitat;
    if (!POKEMON_HABITATS.includes(habitat)) {
      throw new Error(`La zona ${zone.id} usa un hábitat que PokéAPI no publica.`);
    }
  }

  const quota = EXPEDITION_ZONES.reduce((sum, zone) => sum + zone.quota, 0);
  if (quota !== TARGET_ENCOUNTERS || TARGET_ENCOUNTERS !== FIELD_ENCOUNTERS) {
    throw new Error(`Las cuotas suman ${quota}, no ${FIELD_ENCOUNTERS}.`);
  }
  if (KANTO_CATALOG.length !== EXPEDITION_SIZE) {
    throw new Error(`El catálogo tiene ${KANTO_CATALOG.length} fichas.`);
  }

  const fetchBefore = globalThis.fetch;
  let placementCalls = 0;
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    placementCalls += 1;
    return fetchBefore(...args);
  }) as typeof fetch;
  const first = buildFieldSightings();
  const reversed = buildFieldSightings([...KANTO_CATALOG].reverse());
  globalThis.fetch = fetchBefore;
  if (placementCalls !== 0) {
    throw new Error(`Colocar encuentros llamó a fetch ${placementCalls} veces.`);
  }
  if (JSON.stringify(first) !== JSON.stringify(reversed)) {
    throw new Error("El orden del catálogo cambió las coordenadas o las especies.");
  }
  if (first.length !== FIELD_ENCOUNTERS) {
    throw new Error(`Se esperaban ${FIELD_ENCOUNTERS} encuentros de campo y hay ${first.length}.`);
  }

  const reserved = KANTO_CATALOG.filter((entry) => entry.role === "reserved");
  const reservedIds = reserved.map((entry) => entry.nationalId).sort((left, right) => left - right);
  const expectedReserved = [...RESERVED_NATIONAL_IDS].sort((left, right) => left - right);
  if (reserved.length !== 6 || reservedIds.join(",") !== expectedReserved.join(",")) {
    throw new Error(`Los reservados no son los seis previstos: ${reservedIds.join(",")}.`);
  }
  for (const entry of reserved) {
    if (entry.zoneId !== null || findSighting(first, entry.encounterId)) {
      throw new Error(`${entry.speciesName} está colocado como encuentro común.`);
    }
  }

  const numbers = new Set<number>();
  const nationalIds = new Set<number>();
  for (const entry of KANTO_CATALOG) {
    if (entry.nationalId < 1 || entry.nationalId > 151) {
      throw new Error(`${entry.speciesName} tiene id nacional ${entry.nationalId}.`);
    }
    if (entry.expeditionNumber < 1 || entry.expeditionNumber > EXPEDITION_SIZE) {
      throw new Error(`${entry.encounterId} tiene expedición ${entry.expeditionNumber}.`);
    }
    if (numbers.has(entry.expeditionNumber) || nationalIds.has(entry.nationalId)) {
      throw new Error(`Identificador repetido en ${entry.encounterId}.`);
    }
    numbers.add(entry.expeditionNumber);
    nationalIds.add(entry.nationalId);
    if (entry.encounterId !== `kanto-${String(entry.nationalId).padStart(3, "0")}`) {
      throw new Error(`${entry.encounterId} no sigue el id estable de la Pokédex.`);
    }
  }

  const sample = first[0];
  if (!sample || findSighting(first, sample.id)?.nationalId !== sample.nationalId) {
    throw new Error("La selección no devolvió el encuentro pedido.");
  }
  if (findSighting(first, "kanto-000") !== null) {
    throw new Error("La selección devolvió un encuentro que no existe.");
  }

  const blank = undiscovered(sample.id);
  if (blank.state !== "undiscovered" || DISCOVERY_STATES.length !== 3 || blank.encounterId !== sample.id) {
    throw new Error("El contrato de descubrimiento no arranca en sin descubrir.");
  }

  const offsets = separateZoneOffsets([
    { id: "cerca-a", x: 0, y: 0, w: 80, h: 44 },
    { id: "cerca-b", x: 10, y: 4, w: 84, h: 44 },
    { id: "lejos", x: 400, y: 0, w: 80, h: 44 },
  ]);
  const left = offsets.get("cerca-a");
  const right = offsets.get("cerca-b");
  const far = offsets.get("lejos");
  const centerDx = Math.abs(10 + (right?.[0] ?? 0) - (left?.[0] ?? 0));
  const centerDy = Math.abs(4 + (right?.[1] ?? 0) - (left?.[1] ?? 0));
  const stillOver =
    centerDx < (80 + 84) / 2 + 8 && centerDy < (44 + 44) / 2 + 8;
  if (!left || !right || !far || stillOver) {
    throw new Error("Dos sellos superpuestos no se separaron.");
  }
  if (Math.hypot(far[0], far[1]) > 1) {
    throw new Error("Un sello lejano se movió de su ancla.");
  }

  const seen = new Set<string>();
  for (const zone of EXPEDITION_ZONES) {
    const group = first.filter((sighting) => sighting.zoneId === zone.id);
    if (group.length !== zone.quota) {
      throw new Error(`${zone.id} tiene ${group.length} encuentros y la cuota es ${zone.quota}.`);
    }
    for (const sighting of group) {
      const card = KANTO_CATALOG.find((entry) => entry.encounterId === sighting.id);
      if (!card || card.zoneId !== zone.id || card.habitat !== zone.habitat) {
        throw new Error(`${sighting.id} no respeta la zona ${zone.id}.`);
      }
      if (seen.has(sighting.speciesName)) {
        throw new Error(`La especie ${sighting.speciesName} está repetida.`);
      }
      seen.add(sighting.speciesName);
      const point = { latitude: sighting.latitude, longitude: sighting.longitude };
      if (!containsBounds(zone.bounds, point)) {
        throw new Error(`${sighting.id} quedó fuera del recuadro de ${zone.name}.`);
      }
      if (!isEastOfChile(point)) {
        throw new Error(`${sighting.id} quedó al oeste de la divisoria con Chile.`);
      }
    }
  }

  await assertCatalogAgainstApi();

  console.log(
    `OK pokemon=${pikachu.name} id=${pikachu.id} tipos=${typeNames.join("|")} stats=${statNames.join("|")} habitats=${POKEMON_HABITATS.length} forestSpecies=${forestSpecies} zones=${EXPEDITION_ZONES.length}`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function assertCatalogAgainstApi(): Promise<void> {
  const pending = [...KANTO_CATALOG];
  while (pending.length > 0) {
    const batch = pending.splice(0, 8);
    await Promise.all(
      batch.map(async (entry) => {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${entry.nationalId}`,
        );
        if (!response.ok) {
          throw new Error(
            `PokéAPI respondió ${response.status} para la especie ${entry.nationalId}.`,
          );
        }
        const value: unknown = await response.json();
        if (!isRecord(value) || typeof value.id !== "number" || typeof value.name !== "string") {
          throw new Error(`La especie ${entry.nationalId} no tiene id o nombre.`);
        }
        if (value.id !== entry.nationalId || value.name !== entry.speciesName) {
          throw new Error(
            `${entry.speciesName} no coincide con ${value.name} #${String(value.id)}.`,
          );
        }
        if (!isRecord(value.generation) || value.generation.name !== "generation-i") {
          throw new Error(`${entry.speciesName} no es de la primera generación.`);
        }
        if (!isRecord(value.habitat) || typeof value.habitat.name !== "string") {
          throw new Error(`${entry.speciesName} no trae hábitat.`);
        }
        if (value.habitat.name !== entry.habitat) {
          throw new Error(
            `${entry.speciesName} es ${value.habitat.name} en PokéAPI y el catálogo dice ${entry.habitat}.`,
          );
        }
      }),
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
