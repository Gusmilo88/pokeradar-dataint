import {
  EXPEDITION_ZONES,
  HABITAT_LABEL,
  type ExpeditionHabitat,
  type ExpeditionZone,
  type Sighting,
} from "@/lib/expedition/argentina";
import { speciesLabel } from "@/lib/pokeapi/labels";

export const REGIONAL_ZOOM = 6.5;
export const INSPECT_ZOOM = 12.2;
export const STACK_GAP_PX = 36;

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
  kind: "zone" | "encounter" | "stack";
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
      shortLabel: `${zone.code} ${count}`,
      label: `${zone.name}, ${zone.region}. ${count} encuentros de ${HABITAT_LABEL[zone.habitat]}. Acercar.`,
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
        shortLabel: name.split(" ")[0]?.slice(0, 9) ?? HABITAT_CODE[zone.habitat],
        label: `${name}. ${zone.name}. ${HABITAT_LABEL[zone.habitat]}. Encuentro simulado.`,
      },
    ];
  });
}

export function collapsePins(
  pins: readonly FieldPin[],
  project: (pin: FieldPin) => { x: number; y: number },
  gap = STACK_GAP_PX,
): FieldPin[] {
  const groups: { pin: FieldPin; x: number; y: number; members: FieldPin[] }[] = [];
  for (const pin of pins) {
    const point = project(pin);
    const group = groups.find(
      (item) => Math.hypot(item.x - point.x, item.y - point.y) < gap,
    );
    if (group) {
      group.members.push(pin);
    } else {
      groups.push({ pin, x: point.x, y: point.y, members: [pin] });
    }
  }

  return groups.map((group) => {
    if (group.members.length === 1) {
      return group.pin;
    }
    const count = group.members.length;
    return {
      id: `stack:${group.pin.id}`,
      zoneId: group.pin.zoneId,
      kind: "stack" as const,
      longitude: group.pin.longitude,
      latitude: group.pin.latitude,
      shortLabel: String(count),
      label: `${count} encuentros en este punto del mapa. Acercar para separarlos.`,
    };
  });
}

export function findZone(zoneId: string): ExpeditionZone | undefined {
  return EXPEDITION_ZONES.find((zone) => zone.id === zoneId);
}
