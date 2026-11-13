import type { GeoPoint, ZoneBounds } from "@/lib/expedition/argentina";

/**
 * Borde aproximado Argentina–Chile. La longitud crece hacia el este:
 * un punto argentino queda al este de esta línea.
 * El margen empuja los encuentros fuera de la divisoria.
 */
const CHILE_BORDER: readonly [number, number][] = [
  [-22, -66.35],
  [-24.5, -67.15],
  [-28, -68.95],
  [-32.6, -69.99],
  [-36, -70.55],
  [-40, -71.55],
  [-46, -72.35],
  [-50.5, -73.18],
  [-54, -70.4],
];

function borderLongitude(latitude: number): number {
  const first = CHILE_BORDER[0];
  const last = CHILE_BORDER[CHILE_BORDER.length - 1];
  if (!first || !last) {
    return -64;
  }
  if (latitude >= first[0]) {
    return first[1];
  }
  if (latitude <= last[0]) {
    return last[1];
  }
  for (let index = 0; index < CHILE_BORDER.length - 1; index += 1) {
    const start = CHILE_BORDER[index];
    const end = CHILE_BORDER[index + 1];
    if (!start || !end) {
      continue;
    }
    if (latitude <= start[0] && latitude >= end[0]) {
      const span = start[0] - end[0];
      const ratio = span === 0 ? 0 : (start[0] - latitude) / span;
      return start[1] + (end[1] - start[1]) * ratio;
    }
  }
  return last[1];
}

export function containsBounds(bounds: ZoneBounds, point: GeoPoint): boolean {
  return (
    point.latitude <= bounds.north &&
    point.latitude >= bounds.south &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  );
}

export function isEastOfChile(point: GeoPoint): boolean {
  return point.longitude >= borderLongitude(point.latitude);
}
