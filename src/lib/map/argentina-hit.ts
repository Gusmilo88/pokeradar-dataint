import type { GeoPoint } from "@/lib/expedition/argentina";
import { ARGENTINA_LAND } from "@/lib/map/argentina-land";

type Ring = readonly (readonly number[])[];
type Polygon = readonly Ring[];

function pointInRing(point: GeoPoint, ring: Ring): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const current = ring[index];
    const prior = ring[previous];
    if (!current || !prior) {
      continue;
    }
    const x1 = current[0];
    const y1 = current[1];
    const x2 = prior[0];
    const y2 = prior[1];
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
      continue;
    }
    const crosses = y1 > point.latitude !== y2 > point.latitude;
    if (!crosses) {
      continue;
    }
    const edge = ((x2 - x1) * (point.latitude - y1)) / (y2 - y1) + x1;
    if (point.longitude < edge) {
      inside = !inside;
    }
  }
  return inside;
}

function polygons(): readonly Polygon[] {
  const feature = ARGENTINA_LAND.features[0];
  return feature?.geometry.coordinates ?? [];
}

/** Punto dentro de polígonos [contorno, ...huecos]. El mismo criterio que Argentina. */
export function containsPolygons(point: GeoPoint, polygons: readonly Polygon[]): boolean {
  return polygons.some((polygon) => {
    const [shell, ...holes] = polygon;
    if (!shell || !pointInRing(point, shell)) {
      return false;
    }
    return holes.every((hole) => !pointInRing(point, hole));
  });
}

/** Punto dentro del polígono ARG de Natural Earth, restando huecos. */
export function containsArgentina(point: GeoPoint): boolean {
  return containsPolygons(point, polygons());
}
