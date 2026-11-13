import {
  EXPEDITION_ZONES,
  type ExpeditionZone,
  type GeoPoint,
  type Sighting,
} from "@/lib/expedition/argentina";
import { containsBounds, isEastOfChile } from "@/lib/expedition/geography";
import {
  EXPEDITION_SIZE,
  FIELD_ENCOUNTERS,
  KANTO_CATALOG,
  type CatalogEntry,
} from "@/lib/expedition/kanto";
import { hashString, mulberry32 } from "@/lib/expedition/seed";

export const SIGHTING_SEED = "pokeradar-kanto-v1";
export const TARGET_ENCOUNTERS = FIELD_ENCOUNTERS;

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

function placeEntry(
  zone: ExpeditionZone,
  encounterId: string,
  index: number,
  taken: readonly GeoPoint[],
  seed: string,
): GeoPoint {
  const columns = Math.ceil(Math.sqrt(zone.quota));
  const rows = Math.ceil(zone.quota / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const random = mulberry32(hashString(`${seed}:${encounterId}`));
  let placed = cellCenter(zone, column, row, columns, rows);
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const point = cellPoint(random, zone, column, row, columns, rows);
    if (accept(point, zone, taken)) {
      placed = point;
      break;
    }
  }
  return placed;
}

export function findSighting(
  sightings: readonly Sighting[],
  id: string | null,
): Sighting | null {
  if (!id) {
    return null;
  }
  return sightings.find((sighting) => sighting.id === id) ?? null;
}

export function buildFieldSightings(
  entries: readonly CatalogEntry[] = KANTO_CATALOG,
  zones: readonly ExpeditionZone[] = EXPEDITION_ZONES,
  seed = SIGHTING_SEED,
): Sighting[] {
  return placeCatalog(entries, zones, seed);
}

function placeCatalog(
  entries: readonly CatalogEntry[],
  zones: readonly ExpeditionZone[],
  seed: string,
): Sighting[] {
  const resolvedZones = zones;
  if (entries.length !== EXPEDITION_SIZE) {
    throw new Error(`El catálogo tiene ${entries.length} fichas y la expedición pide ${EXPEDITION_SIZE}.`);
  }

  const quota = resolvedZones.reduce((sum, zone) => sum + zone.quota, 0);
  if (quota !== FIELD_ENCOUNTERS) {
    throw new Error(`Las cuotas suman ${quota} y el campo pide ${FIELD_ENCOUNTERS}.`);
  }

  const ids = new Set<string>();
  const numbers = new Set<number>();
  const species = new Set<string>();
  const byZone = new Map<string, CatalogEntry[]>();

  for (const entry of entries) {
    if (ids.has(entry.encounterId) || numbers.has(entry.expeditionNumber) || species.has(entry.speciesName)) {
      throw new Error(`Ficha repetida: ${entry.encounterId}.`);
    }
    ids.add(entry.encounterId);
    numbers.add(entry.expeditionNumber);
    species.add(entry.speciesName);
    if (entry.role === "reserved") {
      continue;
    }
    if (!entry.zoneId) {
      throw new Error(`${entry.encounterId} es de campo y no tiene zona.`);
    }
    const group = byZone.get(entry.zoneId) ?? [];
    group.push(entry);
    byZone.set(entry.zoneId, group);
  }

  const sightings: Sighting[] = [];

  for (const zone of resolvedZones) {
    const group = (byZone.get(zone.id) ?? [])
      .slice()
      .sort((left, right) => left.encounterId.localeCompare(right.encounterId));
    if (group.length !== zone.quota) {
      throw new Error(`${zone.id} tiene ${group.length} especies y la cuota es ${zone.quota}.`);
    }
    const taken: GeoPoint[] = [];
    group.forEach((entry, index) => {
      if (entry.habitat !== zone.habitat) {
        throw new Error(`${entry.speciesName} es ${entry.habitat} y ${zone.id} pide ${zone.habitat}.`);
      }
      const point = placeEntry(zone, entry.encounterId, index, taken, seed);
      taken.push(point);
      sightings.push({
        id: entry.encounterId,
        expeditionNumber: entry.expeditionNumber,
        nationalId: entry.nationalId,
        speciesName: entry.speciesName,
        zoneId: zone.id,
        latitude: point.latitude,
        longitude: point.longitude,
      });
    });
  }

  if (sightings.length !== FIELD_ENCOUNTERS) {
    throw new Error(`Se colocaron ${sightings.length} encuentros y el campo pide ${FIELD_ENCOUNTERS}.`);
  }

  return sightings;
}
