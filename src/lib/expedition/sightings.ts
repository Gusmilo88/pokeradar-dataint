import type { ExpeditionHabitat, ExpeditionZone, GeoPoint, Sighting } from "@/lib/expedition/argentina";
import { hashString, mulberry32 } from "@/lib/expedition/seed";

export const ENCOUNTERS_PER_ZONE = 2;
export const SIGHTING_SEED = "pokeradar-argentina-v1";

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

export function bearingDegrees(from: GeoPoint, to: GeoPoint): number {
  const north = (to.latitude - from.latitude) * KM_PER_DEGREE_LAT;
  const east =
    (to.longitude - from.longitude) *
    KM_PER_DEGREE_LNG *
    Math.cos((from.latitude * Math.PI) / 180);
  const degrees = (Math.atan2(east, north) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

export function angleDelta(left: number, right: number): number {
  const diff = Math.abs(left - right) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function move(anchor: GeoPoint, distance: number, bearing: number): GeoPoint {
  const radians = (bearing * Math.PI) / 180;
  const north = distance * Math.cos(radians);
  const east = distance * Math.sin(radians);
  const latitude = anchor.latitude + north / KM_PER_DEGREE_LAT;
  const cosine = Math.cos((anchor.latitude * Math.PI) / 180);
  const longitude =
    cosine === 0 ? anchor.longitude : anchor.longitude + east / (KM_PER_DEGREE_LNG * cosine);
  return { latitude, longitude };
}

function placeEncounter(
  random: () => number,
  zone: ExpeditionZone,
  taken: readonly GeoPoint[],
): GeoPoint {
  const { spreadKm, bearingDeg, bearingSpanDeg } = zone.placement;
  const minimum = Math.min(0.8, spreadKm * 0.4);
  let chosen = zone.anchor;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const distance = spreadKm * (0.4 + 0.6 * Math.sqrt(random()));
    const bearing = bearingDeg + (random() - 0.5) * bearingSpanDeg;
    const point = move(zone.anchor, distance, bearing);
    chosen = point;
    const clear = taken.every((other) => distanceKm(other, point) >= minimum);
    if (clear) {
      return point;
    }
  }

  return chosen;
}

export function buildSightings(
  zones: readonly ExpeditionZone[],
  speciesByHabitat: Readonly<Record<ExpeditionHabitat, readonly string[]>>,
  seed = SIGHTING_SEED,
): Sighting[] {
  const taken: GeoPoint[] = [];
  const sightings: Sighting[] = [];

  for (const zone of zones) {
    const names = speciesByHabitat[zone.habitat];
    if (!names) {
      throw new Error(`Falta el listado de especies para ${zone.habitat}.`);
    }

    const pool = [...names].sort((left, right) => left.localeCompare(right));
    const random = mulberry32(hashString(`${seed}:${zone.id}`));
    const count = Math.min(ENCOUNTERS_PER_ZONE, pool.length);

    for (let index = 0; index < count; index += 1) {
      const pick = Math.floor(random() * pool.length);
      const speciesName = pool[pick];
      if (!speciesName) {
        throw new Error(`No quedó especie para ${zone.id}.`);
      }
      pool.splice(pick, 1);
      const point = placeEncounter(random, zone, taken);
      taken.push(point);
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
