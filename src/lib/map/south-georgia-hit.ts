import type { GeoPoint } from "@/lib/expedition/argentina";
import { containsPolygons } from "@/lib/map/argentina-hit";
import collection from "@/lib/map/south-georgia-land.json";

/**
 * Natural Earth 5.1.2, `ne_50m_admin_0_countries`, ADM0_A3 = SGS.
 * Solo el anillo de la isla Georgia del Sur (55 vértices, 4 decimales).
 * Las Sandwich del Sur quedan fuera. No se fusiona con el polígono ARG.
 */
export const SOUTH_GEORGIA_NOTE =
  "Isla Georgia del Sur, Natural Earth 5.1.2 (admin-0, 1:50.000.000). No forma parte del polígono ARG ni incluye las Sandwich del Sur.";

export function containsSouthGeorgia(point: GeoPoint): boolean {
  const feature = collection.features[0];
  const polygon = feature?.geometry.coordinates;
  if (!polygon) {
    return false;
  }
  return containsPolygons(point, [polygon]);
}
