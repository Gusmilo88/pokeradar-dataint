import type { ExpeditionHabitat } from "@/lib/expedition/argentina";

/**
 * Relación de juego entre el hábitat que PokéAPI publica y la zona argentina.
 * No agrega atributos que la API no tenga.
 */
export const BIOME_NOTE: Record<ExpeditionHabitat, string> = {
  urban: "Ciudad.",
  forest: "Selva.",
  "waters-edge": "Orilla.",
  grassland: "Pastizal.",
  mountain: "Montaña.",
  sea: "Mar.",
  "rough-terrain": "Altiplano.",
  cave: "Cueva.",
};
