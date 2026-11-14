import type { GeoPoint } from "@/lib/expedition/argentina";
import { containsPolygons } from "@/lib/map/argentina-hit";
import collection from "@/lib/map/atlantic-islands.json";

type Ring = readonly (readonly number[])[];
type Polygon = readonly Ring[];

/**
 * Natural Earth 5.1.2, `ne_10m_admin_0_countries`.
 * Malvinas es el feature ADM0_A3 = FLK.
 * Georgias del Sur y Sandwich del Sur salen de ADM0_A3 = SGS, partidos en longitud -34.
 * Cada grupo es un feature. No se unen entre sí ni con el polígono ARG.
 */
export const ATLANTIC_NOTE =
  "Malvinas, Georgias del Sur y Sandwich del Sur, Natural Earth 5.1.2 (admin-0, 1:10.000.000), en polígonos separados.";

export const ATLANTIC_LABELS = [
  { group: "malvinas", name: "ISLAS MALVINAS", longitude: -59.52, latitude: -50.62 },
  { group: "georgias", name: "ISLAS GEORGIAS DEL SUR", longitude: -36.9, latitude: -53.7 },
  { group: "sandwich", name: "ISLAS SANDWICH DEL SUR", longitude: -25.7, latitude: -57.95 },
] as const;

export type AtlanticGroup = (typeof ATLANTIC_LABELS)[number]["group"];

function polygonsOf(group: AtlanticGroup): readonly Polygon[] {
  const feature = collection.features.find((item) => item.properties.group === group);
  return feature?.geometry.coordinates ?? [];
}

function containsGroup(group: AtlanticGroup, point: GeoPoint): boolean {
  return containsPolygons(point, polygonsOf(group));
}

export function containsFalklands(point: GeoPoint): boolean {
  return containsGroup("malvinas", point);
}

export function containsSouthGeorgia(point: GeoPoint): boolean {
  return containsGroup("georgias", point);
}

export function containsSouthSandwich(point: GeoPoint): boolean {
  return containsGroup("sandwich", point);
}

export function atlanticPartCount(group: AtlanticGroup): number {
  return polygonsOf(group).length;
}

export function atlanticBounds(group: AtlanticGroup): {
  west: number;
  east: number;
  south: number;
  north: number;
} {
  let west = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  for (const polygon of polygonsOf(group)) {
    for (const ring of polygon) {
      for (const point of ring) {
        const longitude = point[0];
        const latitude = point[1];
        if (longitude === undefined || latitude === undefined) {
          continue;
        }
        west = Math.min(west, longitude);
        east = Math.max(east, longitude);
        south = Math.min(south, latitude);
        north = Math.max(north, latitude);
      }
    }
  }
  return { west, east, south, north };
}
