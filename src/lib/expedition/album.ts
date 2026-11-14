import { captureAccent, CAPTURE_ACCENTS, type CaptureAccentId } from "@/lib/expedition/capture-accent";
import type { DiscoveryState } from "@/lib/expedition/discovery";
import { EXPEDITION_SIZE, type CatalogEntry } from "@/lib/expedition/kanto";
import { discoveryState, type Progress } from "@/lib/expedition/progress";
import { speciesLabel } from "@/lib/pokeapi/labels";

export const ALBUM_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "unknown", label: "Desconocidos" },
  { id: "pending", label: "Sin capturar" },
  { id: "caught", label: "Capturados" },
  { id: "reserved", label: "Especiales" },
] as const;

export type AlbumFilter = (typeof ALBUM_FILTERS)[number]["id"];

export interface AlbumCounts {
  total: number;
  seen: number;
  caught: number;
  percent: number;
}

/** Vistos y capturados salen de los conjuntos. Un id no suma dos veces. */
export function albumCounts(progress: Progress): AlbumCounts {
  const caught = progress.caught.size;
  return {
    total: EXPEDITION_SIZE,
    seen: progress.seen.size,
    caught,
    percent: Math.round((caught / EXPEDITION_SIZE) * 100),
  };
}

export function albumAccent(entry: CatalogEntry): CaptureAccentId | null {
  return entry.role === "reserved" ? captureAccent(entry.encounterId) : null;
}

/**
 * Ilustración del frente. Solo si la carta ya está revelada.
 * Primero el artwork oficial de la ficha; si falta, el sprite que ya tenemos.
 */
export function albumArtwork(
  sprites: {
    officialArtwork: string | null;
    blackWhite: string | null;
    front_default: string | null;
  } | null,
  revealed: boolean,
): string | null {
  if (!revealed || sprites === null) {
    return null;
  }
  return sprites.officialArtwork ?? sprites.blackWhite ?? sprites.front_default;
}

/** El PS de la carta es la estadística `hp`. Si no está, no se inventa. */
export function albumHitPoints(stats: readonly { name: string; value: number }[]): number | null {
  const hp = stats.find((stat) => stat.name === "hp");
  if (!hp || !Number.isInteger(hp.value) || hp.value < 0) {
    return null;
  }
  return hp.value;
}

export function albumAccentLabel(entry: CatalogEntry): string | null {
  const accent = albumAccent(entry);
  if (!accent) {
    return null;
  }
  const match = Object.values(CAPTURE_ACCENTS).find((item) => item.id === accent);
  return match?.label ?? null;
}

function passesFilter(entry: CatalogEntry, state: DiscoveryState, filter: AlbumFilter): boolean {
  if (filter === "unknown") {
    return state === "undiscovered";
  }
  if (filter === "pending") {
    return state === "seen";
  }
  if (filter === "caught") {
    return state === "caught";
  }
  if (filter === "reserved") {
    return entry.role === "reserved";
  }
  return true;
}

/**
 * El nombre y el número nacional solo comparan si la carta ya los muestra.
 * El número de expedición está siempre a la vista.
 */
export function albumMatches(entry: CatalogEntry, state: DiscoveryState, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  if (/^\d{1,4}$/.test(needle)) {
    const number = Number(needle);
    if (number === entry.expeditionNumber) {
      return true;
    }
    return state !== "undiscovered" && number === entry.nationalId;
  }
  if (state === "undiscovered") {
    return false;
  }
  const visible = speciesLabel(entry.speciesName).toLowerCase();
  return visible.includes(needle) || entry.speciesName.toLowerCase().includes(needle);
}

export function filterAlbum(
  entries: readonly CatalogEntry[],
  progress: Progress,
  filter: AlbumFilter,
  query: string,
): CatalogEntry[] {
  return entries.filter((entry) => {
    const state = discoveryState(progress, entry.encounterId);
    return passesFilter(entry, state, filter) && albumMatches(entry, state, query);
  });
}
