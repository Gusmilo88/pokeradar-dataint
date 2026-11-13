import type { GeoPoint } from "@/lib/expedition/argentina";

/**
 * Enclave especial. El id de encuentro apunta al catálogo; el nombre de la
 * especie no se muestra hasta que la ficha de PokéAPI responde.
 * `scene` identifica el dibujo. Un bloque posterior puede cambiar ese dibujo
 * por un asset pixel art elegido a mano, sin agregar otro sistema de rutas.
 */
export interface Enclave {
  id: string;
  place: string;
  region: string;
  anomaly: string;
  sealed: string;
  point: GeoPoint;
  encounterId: string;
  scene: "glacial";
}

export const ENCLAVES: readonly Enclave[] = [
  {
    id: "santuario-glacial",
    place: "Santuario Glacial",
    region: "Santa Cruz",
    anomaly:
      "Una fractura quieta en el hielo del sur. No coincide con los encuentros de la zona.",
    sealed: "En el centro hay un sello de hielo. Todavía no tiene nombre.",
    point: { latitude: -50.7, longitude: -73 },
    encounterId: "kanto-144",
    scene: "glacial",
  },
];

export function findEnclave(id: string | null): Enclave | null {
  if (!id) {
    return null;
  }
  return ENCLAVES.find((enclave) => enclave.id === id) ?? null;
}

export function findEnclaveByEncounter(encounterId: string): Enclave | null {
  return ENCLAVES.find((enclave) => enclave.encounterId === encounterId) ?? null;
}
