import type { CSSProperties } from "react";
import type { GeoPoint } from "@/lib/expedition/argentina";

/**
 * Enclave especial. El id de encuentro apunta al catálogo; el nombre de la
 * especie no se muestra hasta que la ficha de PokéAPI responde.
 * `scene` identifica el dibujo. Un bloque posterior puede cambiar ese dibujo
 * por un asset pixel art elegido a mano, sin agregar otro sistema de rutas.
 * `palette` pinta el marcador, el pulso del altar y los acentos del rito.
 * Un enclave nuevo elige esos colores; el componente del pulso no se copia.
 */
export type EnclaveScene = "glacial" | "storm" | "ember" | "fossil" | "lab" | "grove";

export interface EnclavePalette {
  ring: string;
  halo: string;
  core: string;
  hot: string;
  rite: string;
  altar: string;
  altarSoft: string;
  altarFade: string;
  spark: string;
  mouth: string;
  mouthSoft: string;
  mouthFade: string;
  pinHi: string;
  pinMid: string;
  pinDeep: string;
  pinEdge: string;
  pinInk: string;
  pinLine: string;
  pinRing: string;
  pinGlow: string;
  pinGlowSoft: string;
}

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
  /** Línea de la visita ya descubierta. Si falta, se arma con el nombre de la ficha. */
  manifested?: string;
  /** Título del rito. Si falta, se usa la frase de las aves. */
  arrival?: string;
  palette: EnclavePalette;
}

const GLACIAL: EnclavePalette = {
  ring: "rgba(126, 232, 255, 0.95)",
  halo: "rgba(122, 108, 255, 0.8)",
  core: "#d7f6ff",
  hot: "#f3fffb",
  rite: "rgba(210, 245, 255, 0.72)",
  altar: "rgba(230, 255, 255, 0.42)",
  altarSoft: "rgba(120, 220, 255, 0.1)",
  altarFade: "rgba(230, 255, 255, 0)",
  spark: "#f7fffd",
  mouth: "rgba(210, 255, 248, 0.55)",
  mouthSoft: "rgba(80, 210, 255, 0.12)",
  mouthFade: "rgba(210, 255, 248, 0)",
  pinHi: "#f3fffb",
  pinMid: "#8ef6df",
  pinDeep: "#3aa0ff",
  pinEdge: "#7a6cff",
  pinInk: "#04141c",
  pinLine: "#d9fff4",
  pinRing: "rgba(125, 255, 195, 0.7)",
  pinGlow: "rgba(90, 150, 255, 0.55)",
  pinGlowSoft: "rgba(125, 255, 195, 0.22)",
};

const STORM: EnclavePalette = {
  ring: "rgba(255, 224, 74, 0.96)",
  halo: "rgba(240, 180, 41, 0.82)",
  core: "#fff4c2",
  hot: "#fff8dc",
  rite: "rgba(255, 236, 160, 0.72)",
  altar: "rgba(255, 236, 160, 0.55)",
  altarSoft: "rgba(255, 190, 40, 0.14)",
  altarFade: "rgba(255, 236, 160, 0)",
  spark: "#fff4c2",
  mouth: "rgba(255, 244, 180, 0.62)",
  mouthSoft: "rgba(255, 186, 40, 0.14)",
  mouthFade: "rgba(255, 244, 180, 0)",
  pinHi: "#fff8dc",
  pinMid: "#ffe08a",
  pinDeep: "#f0b429",
  pinEdge: "#c47a12",
  pinInk: "#1a1204",
  pinLine: "#fff1b0",
  pinRing: "rgba(255, 214, 90, 0.75)",
  pinGlow: "rgba(255, 176, 40, 0.5)",
  pinGlowSoft: "rgba(255, 214, 90, 0.22)",
};

const PSYCHIC: EnclavePalette = {
  ring: "rgba(176, 120, 255, 0.96)",
  halo: "rgba(226, 60, 255, 0.7)",
  core: "#efe6ff",
  hot: "#f7f4ff",
  rite: "rgba(196, 150, 255, 0.7)",
  altar: "rgba(160, 110, 255, 0.48)",
  altarSoft: "rgba(40, 20, 80, 0.16)",
  altarFade: "rgba(160, 110, 255, 0)",
  spark: "#d7c4ff",
  mouth: "rgba(176, 110, 255, 0.5)",
  mouthSoft: "rgba(90, 40, 180, 0.14)",
  mouthFade: "rgba(176, 110, 255, 0)",
  pinHi: "#f4f7ff",
  pinMid: "#c9a6ff",
  pinDeep: "#6a2fd4",
  pinEdge: "#e23cff",
  pinInk: "#100818",
  pinLine: "#efe8ff",
  pinRing: "rgba(180, 120, 255, 0.75)",
  pinGlow: "rgba(226, 60, 255, 0.45)",
  pinGlowSoft: "rgba(120, 80, 255, 0.22)",
};

const FOSSIL: EnclavePalette = {
  ring: "rgba(224, 168, 64, 0.95)",
  halo: "rgba(62, 176, 170, 0.55)",
  core: "#f0d08a",
  hot: "#fff1c4",
  rite: "rgba(240, 196, 110, 0.7)",
  altar: "rgba(232, 176, 72, 0.48)",
  altarSoft: "rgba(92, 84, 72, 0.16)",
  altarFade: "rgba(232, 176, 72, 0)",
  spark: "#e8c56a",
  mouth: "rgba(72, 206, 196, 0.4)",
  mouthSoft: "rgba(214, 164, 72, 0.12)",
  mouthFade: "rgba(72, 206, 196, 0)",
  pinHi: "#f6e6c4",
  pinMid: "#e0b15a",
  pinDeep: "#8d6b38",
  pinEdge: "#2f9c98",
  pinInk: "#1c1610",
  pinLine: "#f3e2b8",
  pinRing: "rgba(224, 176, 72, 0.75)",
  pinGlow: "rgba(62, 176, 170, 0.35)",
  pinGlowSoft: "rgba(224, 176, 72, 0.22)",
};

const GROVE: EnclavePalette = {
  ring: "rgba(255, 214, 110, 0.96)",
  halo: "rgba(64, 214, 176, 0.72)",
  core: "#ffe7a8",
  hot: "#fff6d6",
  rite: "rgba(255, 182, 210, 0.7)",
  altar: "rgba(255, 214, 120, 0.42)",
  altarSoft: "rgba(46, 196, 160, 0.14)",
  altarFade: "rgba(255, 214, 120, 0)",
  spark: "#ffe08a",
  mouth: "rgba(92, 220, 176, 0.5)",
  mouthSoft: "rgba(255, 206, 110, 0.14)",
  mouthFade: "rgba(92, 220, 176, 0)",
  pinHi: "#fff8dc",
  pinMid: "#7edec4",
  pinDeep: "#1c8f72",
  pinEdge: "#f0a8c8",
  pinInk: "#102018",
  pinLine: "#fff1c8",
  pinRing: "rgba(255, 210, 120, 0.75)",
  pinGlow: "rgba(64, 214, 176, 0.42)",
  pinGlowSoft: "rgba(243, 166, 200, 0.22)",
};

const EMBER: EnclavePalette = {
  ring: "rgba(255, 122, 47, 0.96)",
  halo: "rgba(190, 36, 12, 0.82)",
  core: "#ffc56b",
  hot: "#ffe7c2",
  rite: "rgba(255, 150, 60, 0.72)",
  altar: "rgba(255, 120, 40, 0.5)",
  altarSoft: "rgba(180, 40, 10, 0.16)",
  altarFade: "rgba(255, 120, 40, 0)",
  spark: "#ffb15a",
  mouth: "rgba(255, 140, 48, 0.58)",
  mouthSoft: "rgba(180, 40, 10, 0.16)",
  mouthFade: "rgba(255, 140, 48, 0)",
  pinHi: "#ffe8c8",
  pinMid: "#ff9a3c",
  pinDeep: "#e23b12",
  pinEdge: "#9a1c08",
  pinInk: "#1a0a04",
  pinLine: "#ffd7a0",
  pinRing: "rgba(255, 140, 40, 0.75)",
  pinGlow: "rgba(220, 50, 10, 0.55)",
  pinGlowSoft: "rgba(255, 140, 40, 0.22)",
};

export function paletteVars(palette: EnclavePalette): CSSProperties {
  return {
    "--pulse-ring": palette.ring,
    "--pulse-halo": palette.halo,
    "--pulse-core": palette.core,
    "--pulse-hot": palette.hot,
    "--rite": palette.rite,
    "--altar": palette.altar,
    "--altar-soft": palette.altarSoft,
    "--altar-fade": palette.altarFade,
    "--spark": palette.spark,
    "--mouth": palette.mouth,
    "--mouth-soft": palette.mouthSoft,
    "--mouth-fade": palette.mouthFade,
    "--pin-hi": palette.pinHi,
    "--pin-mid": palette.pinMid,
    "--pin-deep": palette.pinDeep,
    "--pin-edge": palette.pinEdge,
    "--pin-ink": palette.pinInk,
    "--pin-line": palette.pinLine,
    "--pin-ring": palette.pinRing,
    "--pin-glow": palette.pinGlow,
    "--pin-glow-soft": palette.pinGlowSoft,
  } as CSSProperties;
}

export const ENCLAVES: readonly Enclave[] = [
  {
    id: "santuario-glacial",
    place: "Santuario Glacial",
    region: "Tierra del Fuego",
    anomaly:
      "Una fractura quieta en el hielo del sur. No coincide con los encuentros de la zona.",
    sealed: "En el centro hay un sello de hielo. Todavía no tiene nombre.",
    point: { latitude: -54.638, longitude: -67.759 },
    encounterId: "kanto-144",
    scene: "glacial",
    kicker: "Tierra del Fuego · Lago Escondido",
    accent: "#7ec8d6",
    signal: "Señal glacial",
    remains: "El santuario sigue en el hielo.",
    exterior:
      "Una luz desconocida emerge desde las profundidades del hielo. Algo parece aguardar en su interior.",
    interior:
      "El aire se vuelve helado. Una energía desconocida parece concentrarse sobre el altar...",
    palette: GLACIAL,
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
    palette: STORM,
  },
  {
    id: "santuario-volcanico",
    place: "Santuario Volcánico",
    region: "Mendoza",
    anomaly: "Una grieta caliente en el campo volcánico. No coincide con los encuentros de la zona.",
    sealed: "En el centro hay un altar de roca. Todavía no tiene nombre.",
    point: { latitude: -36.42, longitude: -69.2 },
    encounterId: "kanto-146",
    scene: "ember",
    kicker: "Mendoza · La Payunia",
    accent: "#e85d04",
    signal: "Señal volcánica",
    remains: "El santuario sigue entre las brasas.",
    exterior:
      "Una intensa energía emerge de las profundidades volcánicas. Algo parece despertar entre las llamas.",
    interior: "El calor aumenta. Una presencia desconocida concentra su energía sobre el altar.",
    manifested: "Moltres se ha manifestado.",
    palette: EMBER,
  },
  {
    id: "caverna-fosil",
    place: "Caverna Fósil",
    region: "San Juan",
    anomaly: "Una vibración en la piedra del valle. No coincide con los encuentros de la zona.",
    sealed: "En el centro hay un altar de piedra. Todavía no tiene nombre.",
    point: { latitude: -30.12, longitude: -67.85 },
    encounterId: "kanto-142",
    scene: "fossil",
    kicker: "San Juan · Ischigualasto",
    accent: "#d4a24a",
    signal: "Señal fósil",
    remains: "La caverna sigue entre la piedra.",
    exterior: "Entre rocas milenarias, una señal desconocida emerge desde las profundidades.",
    interior: "Los fósiles parecen reaccionar a una energía antigua. Algo despierta bajo la piedra.",
    manifested: "Aerodactyl se ha manifestado.",
    arrival: "Una presencia antigua se ha manifestado.",
    palette: FOSSIL,
  },
  {
    id: "laboratorio-secreto",
    place: "Laboratorio Secreto",
    region: "Islas Malvinas",
    anomaly: "Una emisión que no coincide con los encuentros de la zona. Sale de la roca.",
    sealed: "En el centro hay una plataforma. Todavía no tiene nombre.",
    point: { latitude: -51.7002, longitude: -58.8259 },
    encounterId: "kanto-150",
    scene: "lab",
    kicker: "Islas Malvinas · Atlántico Sur",
    accent: "#8b5cf6",
    signal: "Señal psíquica",
    remains: "El laboratorio sigue en la montaña.",
    exterior: "Una instalación olvidada sigue emitiendo señales desde el interior de la montaña.",
    interior:
      "Los sistemas de contención están dañados. Una presencia desconocida parece responder a nuestra llegada.",
    manifested: "Mewtwo se ha manifestado.",
    palette: PSYCHIC,
  },
  {
    id: "refugio-escondido",
    place: "Refugio Escondido",
    region: "Islas Georgias del Sur",
    anomaly: "Un verdor imposible entre el hielo del sur. No coincide con los encuentros de la zona.",
    sealed: "En el centro hay una isla. Todavía no tiene nombre.",
    point: { latitude: -54.4408, longitude: -36.5556 },
    encounterId: "kanto-151",
    scene: "grove",
    kicker: "Georgias del Sur · Subantártico",
    accent: "#2fbf8a",
    signal: "Señal esmeralda",
    remains: "El refugio sigue entre el verde.",
    exterior: "Entre raíces milenarias, pequeñas luces revelan un sendero que parece imposible.",
    interior: "El agua permanece en calma. Una presencia diminuta parece observar desde algún lugar del refugio.",
    manifested: "Mew se ha manifestado.",
    arrival: "¡Una presencia diminuta se ha manifestado!",
    palette: GROVE,
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
