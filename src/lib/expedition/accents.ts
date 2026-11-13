import type { ExpeditionZone } from "@/lib/expedition/argentina";

const KM_PER_DEGREE_LAT = 110.574;
const KM_PER_DEGREE_LNG = 111.32;
const STEPS = 40;

export interface AccentCollection {
  type: "FeatureCollection";
  features: AccentFeature[];
}

interface AccentFeature {
  type: "Feature";
  properties: {
    zoneId: string;
    landscape: string;
    kind: "expedition-accent";
    note: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

function ring(latitude: number, longitude: number, radiusKm: number): number[][] {
  const latRadius = radiusKm / KM_PER_DEGREE_LAT;
  const lngRadius = radiusKm / (KM_PER_DEGREE_LNG * Math.cos((latitude * Math.PI) / 180));
  const points: number[][] = [];
  for (let step = 0; step <= STEPS; step += 1) {
    const angle = (step / STEPS) * Math.PI * 2;
    points.push([
      Math.round((longitude + lngRadius * Math.cos(angle)) * 10000) / 10000,
      Math.round((latitude + latRadius * Math.sin(angle)) * 10000) / 10000,
    ]);
  }
  return points;
}

/**
 * Manchas alrededor de cada ancla. No son biomas, provincias ni el rectángulo de los encuentros.
 */
export function expeditionAccents(zones: readonly ExpeditionZone[]): AccentCollection {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      properties: {
        zoneId: zone.id,
        landscape: zone.landscape,
        kind: "expedition-accent",
        note: "Acento de expedición. No es un límite científico.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [ring(zone.anchor.latitude, zone.anchor.longitude, zone.accentKm)],
      },
    })),
  };
}
