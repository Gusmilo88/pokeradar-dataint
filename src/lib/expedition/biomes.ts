import type { ExpeditionHabitat } from "@/lib/expedition/argentina";

/**
 * Relación de juego entre el hábitat que PokéAPI publica y la zona argentina.
 * No agrega atributos que la API no tenga.
 */
export const BIOME_NOTE: Record<ExpeditionHabitat, string> = {
  urban: "Ciudad. La exploración usa el hábitat urban.",
  forest: "Selva. La exploración usa el hábitat forest.",
  "waters-edge": "Agua en movimiento. La exploración usa el hábitat waters-edge.",
  grassland: "Pastizal. PokéAPI no tiene estero; la zona usa grassland.",
  mountain: "Cordillera o hielo. La exploración usa el hábitat mountain.",
  sea: "Mar. La exploración usa el hábitat sea.",
  "rough-terrain": "Altiplano. La exploración usa el hábitat rough-terrain.",
  cave: "Cueva. La exploración usa el hábitat cave.",
};
