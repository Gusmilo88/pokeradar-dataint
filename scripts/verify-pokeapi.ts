import { EXPEDITION_ZONES, type ExpeditionHabitat } from "../src/lib/expedition/argentina";
import {
  angleDelta,
  bearingDegrees,
  buildSightings,
  distanceKm,
} from "../src/lib/expedition/sightings";
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

  const first = buildSightings(EXPEDITION_ZONES, speciesByHabitat);
  const second = buildSightings(EXPEDITION_ZONES, speciesByHabitat);
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error("Los encuentros cambiaron entre dos generaciones con la misma semilla.");
  }
  if (first.length !== EXPEDITION_ZONES.length * 2) {
    throw new Error(`Se esperaban ${EXPEDITION_ZONES.length * 2} encuentros y hay ${first.length}.`);
  }

  for (const zone of EXPEDITION_ZONES) {
    const group = first.filter((sighting) => sighting.zoneId === zone.id);
    const names = new Set<string>();
    for (const sighting of group) {
      if (!speciesByHabitat[zone.habitat].includes(sighting.speciesName)) {
        throw new Error(`${sighting.speciesName} no pertenece al hábitat ${zone.habitat}.`);
      }
      if (names.has(sighting.speciesName)) {
        throw new Error(`La zona ${zone.id} repite ${sighting.speciesName}.`);
      }
      names.add(sighting.speciesName);
      const point = { latitude: sighting.latitude, longitude: sighting.longitude };
      const distance = distanceKm(zone.anchor, point);
      if (distance > zone.placement.spreadKm + 0.05) {
        throw new Error(
          `${sighting.id} quedó a ${distance.toFixed(2)} km, fuera de ${zone.placement.spreadKm} km.`,
        );
      }
      if (zone.placement.bearingSpanDeg < 360) {
        const delta = angleDelta(bearingDegrees(zone.anchor, point), zone.placement.bearingDeg);
        if (delta > zone.placement.bearingSpanDeg / 2 + 0.5) {
          throw new Error(`${sighting.id} salió de la cuña de ${zone.name}.`);
        }
      }
    }
    const minimum = Math.min(0.8, zone.placement.spreadKm * 0.4);
    if (group.length === 2) {
      const left = group[0];
      const right = group[1];
      if (!left || !right) {
        throw new Error(`La zona ${zone.id} no tiene el par de encuentros.`);
      }
      const separation = distanceKm(
        { latitude: left.latitude, longitude: left.longitude },
        { latitude: right.latitude, longitude: right.longitude },
      );
      if (separation + 0.02 < minimum) {
        throw new Error(
          `Los encuentros de ${zone.id} quedaron a ${separation.toFixed(2)} km (mínimo ${minimum.toFixed(2)}).`,
        );
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
