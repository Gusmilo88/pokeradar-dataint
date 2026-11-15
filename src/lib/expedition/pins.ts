import {
  EXPEDITION_ZONES,
  HABITAT_LABEL,
  type ExpeditionHabitat,
  type ExpeditionZone,
  type Sighting,
} from "@/lib/expedition/argentina";
import type { Enclave, EnclavePalette } from "@/lib/expedition/enclaves";
import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import { speciesLabel } from "@/lib/pokeapi/labels";
import { blackWhiteAnimated, blackWhiteStill } from "@/lib/pokeapi/sprites";

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
  kind: "zone" | "encounter" | "stack" | "enclave";
  longitude: number;
  latitude: number;
  shortLabel: string;
  label: string;
  accent: string;
  palette?: EnclavePalette;
  /** Nombre visible solo al enfocar un enclave ya descubierto. */
  focusName?: string;
  count?: number;
  /** Todas las presencias de la zona están capturadas. */
  complete?: boolean;
  presence?: "hidden" | "seen" | "caught";
  nationalId?: number;
  spriteStill?: string;
  spriteAnimated?: string;
}

function zoneById(zones: readonly ExpeditionZone[]): Map<string, ExpeditionZone> {
  return new Map(zones.map((zone) => [zone.id, zone]));
}

export function buildZonePins(
  zones: readonly ExpeditionZone[],
  sightings: readonly Sighting[],
  caughtIds?: ReadonlySet<string>,
  roster?: readonly Sighting[],
): FieldPin[] {
  const catalog = roster ?? sightings;
  return zones.map((zone) => {
    const count = sightings.filter((sighting) => sighting.zoneId === zone.id).length;
    const members = catalog.filter((sighting) => sighting.zoneId === zone.id);
    const complete =
      Boolean(caughtIds) && members.length > 0 && members.every((sighting) => caughtIds?.has(sighting.id));
    return {
      id: `zone:${zone.id}`,
      zoneId: zone.id,
      kind: "zone",
      longitude: zone.anchor.longitude,
      latitude: zone.anchor.latitude,
      shortLabel: `${zone.stamp}\n${count}`,
      count,
      ...(complete ? { complete: true } : {}),
      label: complete
        ? `${zone.name}, ${zone.region}. Zona completada. Acercar.`
        : `${zone.name}, ${zone.region}. ${count} encuentros de ${HABITAT_LABEL[zone.habitat]}. Acercar.`,
      accent: zone.accent,
    };
  });
}

export function buildEncounterPins(
  zones: readonly ExpeditionZone[],
  sightings: readonly Sighting[],
  knownNames: ReadonlyMap<string, string>,
  revealedIds: ReadonlySet<string>,
  caughtIds: ReadonlySet<string>,
): FieldPin[] {
  const zonesById = zoneById(zones);
  return sightings.flatMap((sighting) => {
    const zone = zonesById.get(sighting.zoneId);
    if (!zone) {
      return [];
    }
    const caught = caughtIds.has(sighting.id);
    const revealed = caught || revealedIds.has(sighting.id);
    const name = knownNames.get(sighting.speciesName) ?? speciesLabel(sighting.speciesName);
    return [
      {
        id: sighting.id,
        zoneId: zone.id,
        kind: "encounter" as const,
        longitude: sighting.longitude,
        latitude: sighting.latitude,
        presence: caught ? "caught" : revealed ? "seen" : "hidden",
        nationalId: sighting.nationalId,
        ...(caught
          ? {
              spriteStill: blackWhiteStill(sighting.nationalId),
              spriteAnimated: blackWhiteAnimated(sighting.nationalId),
            }
          : {}),
        shortLabel: revealed
          ? (name.split(" ")[0]?.slice(0, 9) ?? HABITAT_CODE[zone.habitat])
          : "???",
        label: revealed
          ? `${name}. ${zone.name}. ${HABITAT_LABEL[zone.habitat]}. Encuentro simulado de Kanto.`
          : `Señal sin identificar. Expedición ${sighting.expeditionNumber}. ${zone.name}.`,
        accent: zone.accent,
      },
    ];
  });
}

export function buildEnclavePins(
  enclaves: readonly Enclave[],
  revealedIds: ReadonlySet<string>,
  knownNames: ReadonlyMap<string, string>,
): FieldPin[] {
  return enclaves.map((enclave) => {
    const revealed = revealedIds.has(enclave.encounterId);
    const card = KANTO_CATALOG.find((entry) => entry.encounterId === enclave.encounterId);
    const name = card
      ? (knownNames.get(card.speciesName) ?? speciesLabel(card.speciesName))
      : "Señal";
    return {
      id: enclave.id,
      zoneId: enclave.id,
      kind: "enclave" as const,
      longitude: enclave.point.longitude,
      latitude: enclave.point.latitude,
      shortLabel: "?",
      ...(revealed ? { focusName: name } : {}),
      label: revealed
        ? `${name}. ${enclave.place}. ${enclave.region}.`
        : `Anomalía sin identificar. ${enclave.signal} en ${enclave.region}.`,
      accent: enclave.accent,
      palette: enclave.palette,
    };
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
      accent: group.pin.accent,
    };
  });
}

/**
 * Separa sellos cuyos rectángulos se pisan. El ancla geográfica no se mueve:
 * el valor es un desplazamiento en píxeles del marcador.
 * `x` e `y` son el centro del sello.
 */
export function separateZoneOffsets(
  points: readonly { id: string; x: number; y: number; w: number; h: number }[],
  padding = 8,
): ReadonlyMap<string, [number, number]> {
  const items = points.map((point) => ({ ...point, ox: 0, oy: 0 }));

  for (let pass = 0; pass < 12; pass += 1) {
    for (let left = 0; left < items.length; left += 1) {
      for (let right = left + 1; right < items.length; right += 1) {
        const a = items[left];
        const b = items[right];
        if (!a || !b) {
          continue;
        }
        const dx = b.x + b.ox - (a.x + a.ox);
        const dy = b.y + b.oy - (a.y + a.oy);
        const overlapX = (a.w + b.w) / 2 + padding - Math.abs(dx);
        const overlapY = (a.h + b.h) / 2 + padding - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) {
          continue;
        }
        if (overlapX < overlapY) {
          const direction = dx === 0 ? 1 : Math.sign(dx);
          a.ox -= direction * (overlapX / 2);
          b.ox += direction * (overlapX / 2);
        } else {
          const direction = dy === 0 ? 1 : Math.sign(dy);
          a.oy -= direction * (overlapY / 2);
          b.oy += direction * (overlapY / 2);
        }
      }
    }
  }

  return new Map(items.map((item) => [item.id, [item.ox, item.oy] as [number, number]]));
}

export function findZone(zoneId: string): ExpeditionZone | undefined {
  return EXPEDITION_ZONES.find((zone) => zone.id === zoneId);
}
