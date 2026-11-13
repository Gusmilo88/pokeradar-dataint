import type { ExpeditionZone } from "@/lib/expedition/argentina";
import type { CatalogEntry } from "@/lib/expedition/kanto";

/**
 * Pistas a partir del hábitat real y de la región asignada.
 * No nombran la especie ni el pueblo. Las reservadas no tienen zona de campo.
 */
const FIELD_HINTS: Record<string, string> = {
  "buenos-aires": "Su presencia parece concentrarse en áreas urbanas.",
  "puerto-iguazu": "Las señales aparecen en zonas de bosque.",
  "cataratas-iguazu": "Los informes apuntan a zonas próximas al agua.",
  ibera: "Se la asoció a pastizales.",
  aconcagua: "Se registraron señales en regiones montañosas.",
  "perito-moreno": "Hay registros en montañas del sur.",
  "puerto-piramides": "Las notas de campo hablan del mar.",
  puna: "Aparece en terreno áspero y seco.",
  "caverna-brujas": "Los informes la sitúan en cuevas.",
  "mar-del-plata": "Se la vincula con orillas de costa.",
};

export const RESERVED_HINT = "Aún no hay una región de campo para esta señal.";

export function explorationHint(entry: CatalogEntry, zone: ExpeditionZone | null): string {
  if (entry.role === "reserved" || !zone) {
    return RESERVED_HINT;
  }
  return FIELD_HINTS[zone.id] ?? RESERVED_HINT;
}
