import type { ExpeditionHabitat, ExpeditionZone, GeoPoint, Sighting } from "@/lib/expedition/argentina";
import { containsBounds, isEastOfChile } from "@/lib/expedition/geography";
import { hashString, mulberry32 } from "@/lib/expedition/seed";

export const SIGHTING_SEED = "pokeradar-argentina-v2";
export const TARGET_ENCOUNTERS = 56;

const KM_PER_DEGREE_LAT = 110.574;
const KM_PER_DEGREE_LNG = 111.32;

export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const north = (to.latitude - from.latitude) * KM_PER_DEGREE_LAT;
  const east =
    (to.longitude - from.longitude) *
    KM_PER_DEGREE_LNG *
    Math.cos((from.latitude * Math.PI) / 180);
  return Math.hypot(north, east);
}

function cellPoint(
  random: () => number,
  zone: ExpeditionZone,
  column: number,
  row: number,
  columns: number,
  rows: number,
): GeoPoint {
  const { west, east, south, north } = zone.bounds;
  const width = (east - west) / columns;
  const height = (north - south) / rows;
  return {
    longitude: west + width * (column + 0.18 + random() * 0.64),
    latitude: south + height * (row + 0.18 + random() * 0.64),
  };
}

function cellCenter(
  zone: ExpeditionZone,
  column: number,
  row: number,
  columns: number,
  rows: number,
): GeoPoint {
  const { west, east, south, north } = zone.bounds;
  return {
    longitude: west + ((east - west) / columns) * (column + 0.5),
    latitude: south + ((north - south) / rows) * (row + 0.5),
  };
}

function accept(point: GeoPoint, zone: ExpeditionZone, taken: readonly GeoPoint[]): boolean {
  if (!containsBounds(zone.bounds, point) || !isEastOfChile(point)) {
    return false;
  }
  return taken.every((other) => distanceKm(other, point) >= 0.45);
}

function placeZone(random: () => number, zone: ExpeditionZone): GeoPoint[] {
  const columns = Math.ceil(Math.sqrt(zone.quota));
  const rows = Math.ceil(zone.quota / columns);
  const points: GeoPoint[] = [];

  for (let index = 0; index < zone.quota; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    let placed = cellCenter(zone, column, row, columns, rows);
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const point = cellPoint(random, zone, column, row, columns, rows);
      if (accept(point, zone, points)) {
        placed = point;
        break;
      }
    }
    points.push(placed);
  }

  return points;
}

export function buildSightings(
  zones: readonly ExpeditionZone[],
  speciesByHabitat: Readonly<Record<ExpeditionHabitat, readonly string[]>>,
  seed = SIGHTING_SEED,
): Sighting[] {
  const quota = zones.reduce((sum, zone) => sum + zone.quota, 0);
  if (quota !== TARGET_ENCOUNTERS) {
    throw new Error(`Las cuotas suman ${quota} y el objetivo es ${TARGET_ENCOUNTERS}.`);
  }

  const used = new Set<string>();
  const sightings: Sighting[] = [];

  for (const zone of zones) {
    const names = speciesByHabitat[zone.habitat];
    if (!names) {
      throw new Error(`Falta el listado de especies para ${zone.habitat}.`);
    }
    const available = [...names]
      .filter((name) => !used.has(name))
      .sort((left, right) => left.localeCompare(right));
    if (available.length < zone.quota) {
      throw new Error(
        `${zone.id} necesita ${zone.quota} especies nuevas de ${zone.habitat} y quedan ${available.length}.`,
      );
    }

    const random = mulberry32(hashString(`${seed}:${zone.id}`));
    const pool = [...available];
    const points = placeZone(random, zone);

    for (let index = 0; index < zone.quota; index += 1) {
      const pick = Math.floor(random() * pool.length);
      const speciesName = pool[pick];
      const point = points[index];
      if (!speciesName || !point) {
        throw new Error(`No quedó especie o coordenada para ${zone.id}.`);
      }
      pool.splice(pick, 1);
      used.add(speciesName);
      sightings.push({
        id: `${zone.id}:${speciesName}:${index}`,
        speciesName,
        zoneId: zone.id,
        latitude: point.latitude,
        longitude: point.longitude,
      });
    }
  }

  return sightings;
}
