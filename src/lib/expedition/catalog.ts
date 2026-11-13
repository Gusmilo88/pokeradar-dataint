import { buildFieldSightings } from "@/lib/expedition/sightings";
import type { Sighting } from "@/lib/expedition/argentina";

/**
 * El catálogo de Kanto es local. Esta función no llama a PokéAPI.
 * La ficha completa se pide recién al elegir un encuentro.
 */
export function loadFieldSightings(): Sighting[] {
  return buildFieldSightings();
}
