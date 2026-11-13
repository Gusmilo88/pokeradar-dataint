import {
  EXPEDITION_ZONES,
  HABITAT_LABEL,
  type ExpeditionHabitat,
  type ExpeditionZone,
  type Sighting,
} from "@/lib/expedition/argentina";
import { speciesLabel } from "@/lib/pokeapi/labels";

export const ENCOUNTER_ZOOM = 12.2;
export const FOCUS_ZOOM = 13.2;

export const EMPTY_PINS: readonly FieldPin[] = [];

const HABITAT_CODE: Record<ExpeditionHabitat, string> = {
  cave: "CV",
  forest: "BQ",
  grassland: "PZ",
  mountain: "MT",
  "rough-terrain": "TR",
  sea: "MR",
  urban: "UR",
  "waters-edge": "OR",
};

export interface FieldPin {
  id: string;
  zoneId: string;
  kind: "zone" | "encounter";
  longitude: number;
  latitude: number;
  shortLabel: string;
  label: string;
}

function zoneById(zones: readonly ExpeditionZone[]): Map<string, ExpeditionZone> {
  return new Map(zones.map((zone) => [zone.id, zone]));
}

export function buildZonePins(
  zones: readonly ExpeditionZone[],
  sightings: readonly Sighting[],
): FieldPin[] {
  return zones.map((zone) => {
    const count = sightings.filter((sighting) => sighting.zoneId === zone.id).length;
    return {
      id: `zone:${zone.id}`,
      zoneId: zone.id,
      kind: "zone",
      longitude: zone.anchor.longitude,
      latitude: zone.anchor.latitude,
      shortLabel: String(count),
      label: `Zona ${zone.name}, ${zone.region}. ${count} encuentros simulados de hábitat ${HABITAT_LABEL[zone.habitat]}. Acercar el mapa.`,
    };
  });
}

export function buildEncounterPins(
  zones: readonly ExpeditionZone[],
  sightings: readonly Sighting[],
  knownNames: ReadonlyMap<string, string>,
): FieldPin[] {
  const zonesById = zoneById(zones);
  return sightings.flatMap((sighting) => {
    const zone = zonesById.get(sighting.zoneId);
    if (!zone) {
      return [];
    }
    const name = knownNames.get(sighting.speciesName) ?? speciesLabel(sighting.speciesName);
    return [
      {
        id: sighting.id,
        zoneId: zone.id,
        kind: "encounter" as const,
        longitude: sighting.longitude,
        latitude: sighting.latitude,
        shortLabel: HABITAT_CODE[zone.habitat],
        label: `Encuentro simulado de ${name} en ${zone.name}. Hábitat ${HABITAT_LABEL[zone.habitat]}.`,
      },
    ];
  });
}

export function findZone(zoneId: string): ExpeditionZone | undefined {
  return EXPEDITION_ZONES.find((zone) => zone.id === zoneId);
}
