import type { GeoPoint } from "@/lib/expedition/argentina";

/**
 * Enclave especial. El id de encuentro apunta al catálogo; el nombre de la
 * especie no se muestra hasta que la ficha de PokéAPI responde.
 * `scene` identifica el dibujo. Un bloque posterior puede cambiar ese dibujo
 * por un asset pixel art elegido a mano, sin agregar otro sistema de rutas.
 */
export type EnclaveScene = "glacial" | "storm";

export interface Enclave {
  id: string;
  place: string;
  region: string;
  anomaly: string;
  sealed: string;
  point: GeoPoint;
  encounterId: string;
  scene: EnclaveScene;
  kicker: string;
  accent: string;
  signal: string;
  remains: string;
  exterior: string;
  interior: string;
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
    kicker: "Santa Cruz · Patagonia",
    accent: "#7ec8d6",
    signal: "Señal glacial",
    remains: "El santuario sigue en el hielo.",
    exterior:
      "Una luz desconocida emerge desde las profundidades del hielo. Algo parece aguardar en su interior.",
    interior:
      "El aire se vuelve helado. Una energía desconocida parece concentrarse sobre el altar...",
  },
  {
    id: "central-electrica",
    place: "Central Eléctrica Abandonada",
    region: "Neuquén",
    anomaly: "Una descarga que no coincide con la red. Sigue activa entre las ruinas.",
    sealed: "En el centro hay un altar de energía. Todavía no tiene nombre.",
    point: { latitude: -40.58, longitude: -70.98 },
    encounterId: "kanto-145",
    scene: "storm",
    kicker: "Neuquén · Comahue",
    accent: "#f0b429",
    signal: "Señal eléctrica",
    remains: "La central sigue en pie.",
    exterior:
      "Una descarga anómala persiste entre las ruinas. Algo poderoso parece seguir activo en su interior.",
    interior:
      "El altar concentra una energía desbordada. La señal parece responder desde el centro.",
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
