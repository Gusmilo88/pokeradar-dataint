import { KANTO_CATALOG } from "@/lib/expedition/kanto";

const SPECIES_BY_ZONE = new Map<string, readonly string[]>();

for (const entry of KANTO_CATALOG) {
  if (entry.role !== "field" || !entry.zoneId) {
    continue;
  }
  const current = SPECIES_BY_ZONE.get(entry.zoneId) ?? [];
  SPECIES_BY_ZONE.set(entry.zoneId, [...current, entry.encounterId]);
}

/** Especies de campo asignadas a la zona. El horario y el clima no las sacan de la lista. */
export function zoneSpeciesIds(zoneId: string): readonly string[] {
  return SPECIES_BY_ZONE.get(zoneId) ?? [];
}

/** La zona está completa cuando cada especie asignada fue capturada. */
export function isZoneCompleted(zoneId: string, caughtIds: ReadonlySet<string>): boolean {
  const species = zoneSpeciesIds(zoneId);
  return species.length > 0 && species.every((id) => caughtIds.has(id));
}
