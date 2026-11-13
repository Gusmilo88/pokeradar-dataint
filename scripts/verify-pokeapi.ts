import { EXPEDITION_ZONES, type ExpeditionHabitat } from "../src/lib/expedition/argentina";
import { containsBounds, isEastOfChile } from "../src/lib/expedition/geography";
import { buildSightings, TARGET_ENCOUNTERS } from "../src/lib/expedition/sightings";
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
  const speciesByHabitat = {} as Record<ExpeditionHabitat, string[]>;

  for (const habitat of POKEMON_HABITATS) {
    const result = await getHabitat(habitat);
    if (result.name !== habitat) {
      throw new Error(`El hábitat ${habitat} respondió como ${result.name}.`);
    }
    if (habitat === "forest") {
      forestSpecies = result.pokemon_species.length;
    }
    if (habitat !== "rare") {
      speciesByHabitat[habitat] = result.pokemon_species.map((species) => species.name);
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
  if (quota !== TARGET_ENCOUNTERS) {
    throw new Error(`Las cuotas suman ${quota}, no ${TARGET_ENCOUNTERS}.`);
  }

  const first = buildSightings(EXPEDITION_ZONES, speciesByHabitat);
  const second = buildSightings(EXPEDITION_ZONES, speciesByHabitat);
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error("Los encuentros cambiaron entre dos generaciones con la misma semilla.");
  }
  if (first.length !== TARGET_ENCOUNTERS) {
    throw new Error(`Se esperaban ${TARGET_ENCOUNTERS} encuentros y hay ${first.length}.`);
  }

  const seen = new Set<string>();
  for (const zone of EXPEDITION_ZONES) {
    const group = first.filter((sighting) => sighting.zoneId === zone.id);
    if (group.length !== zone.quota) {
      throw new Error(`${zone.id} tiene ${group.length} encuentros y la cuota es ${zone.quota}.`);
    }
    for (const sighting of group) {
      if (!speciesByHabitat[zone.habitat].includes(sighting.speciesName)) {
        throw new Error(`${sighting.speciesName} no pertenece al hábitat ${zone.habitat}.`);
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

  console.log(
    `OK pokemon=${pikachu.name} id=${pikachu.id} tipos=${typeNames.join("|")} stats=${statNames.join("|")} habitats=${POKEMON_HABITATS.length} forestSpecies=${forestSpecies} zones=${EXPEDITION_ZONES.length}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
