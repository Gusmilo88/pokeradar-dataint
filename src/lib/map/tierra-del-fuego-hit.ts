import type { GeoPoint } from "@/lib/expedition/argentina";
import { containsPolygons } from "@/lib/map/argentina-hit";
import collection from "@/lib/map/tierra-del-fuego-land.json";

/**
 * Anillo de la Isla Grande extraído de Natural Earth 5.1.2, `ne_10m_admin_0_countries`, ADM0_A3 = ARG.
 * Sirve para validar el santuario. El contorno que se dibuja sigue siendo el de 1:50.000.000.
 * No incluye el continente, la Isla de los Estados ni el lado chileno.
 */
export const TIERRA_DEL_FUEGO_NOTE =
  "Isla Grande de Tierra del Fuego, Natural Earth 5.1.2 (admin-0, 1:10.000.000). Solo valida el punto; no reemplaza el contorno de Argentina.";

/**
 * Recuadro del agua de Lago Escondido, Ushuaia. OSM way 50342725.
 * El sello queda al este, en el paraje, fuera de este recuadro.
 */
export const LAGO_ESCONDIDO_WATER = {
  west: -67.8283,
  east: -67.7621,
  south: -54.6836,
  north: -54.6275,
} as const;

/** Referencia pedida para las inmediaciones del lago. */
export const LAGO_ESCONDIDO_REFERENCE: GeoPoint = {
  latitude: -54.65,
  longitude: -67.78,
};

export function containsTierraDelFuego(point: GeoPoint): boolean {
  const polygon = collection.features[0]?.geometry.coordinates;
  if (!polygon) {
    return false;
  }
  return containsPolygons(point, [polygon]);
}

export function outsideLagoEscondido(point: GeoPoint): boolean {
  const water = LAGO_ESCONDIDO_WATER;
  return (
    point.longitude < water.west ||
    point.longitude > water.east ||
    point.latitude > water.north ||
    point.latitude < water.south
  );
}
