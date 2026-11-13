import {
  EXPEDITION_ZONES,
  type ExpeditionHabitat,
} from "@/lib/expedition/argentina";
import { buildSightings } from "@/lib/expedition/sightings";
import type { Sighting } from "@/lib/expedition/argentina";
import { getHabitat } from "@/lib/pokeapi/client";

export async function loadEncounterCatalog(): Promise<Sighting[]> {
  const habitats = [
    ...new Set(EXPEDITION_ZONES.map((zone) => zone.habitat)),
  ];
  const speciesByHabitat = {} as Record<ExpeditionHabitat, readonly string[]>;

  await Promise.all(
    habitats.map(async (habitat) => {
      const result = await getHabitat(habitat);
      speciesByHabitat[habitat] = result.pokemon_species.map((species) => species.name);
    }),
  );

  return buildSightings(EXPEDITION_ZONES, speciesByHabitat);
}
