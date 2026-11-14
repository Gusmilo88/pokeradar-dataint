import { ARGENTINA_VIEW } from "@/lib/expedition/argentina";

export interface AtlasFrame {
  id: "continental" | "fuego" | "malvinas" | "georgias";
  label: string;
  longitude: number;
  latitude: number;
  zoom: number;
}

/**
 * Encuadres del atlas. El continental es la vista nacional, sin alejarla.
 * Los otros acercan una región y no nombran criaturas.
 */
export const ATLAS_FRAMES: readonly AtlasFrame[] = [
  {
    id: "continental",
    label: "Argentina continental",
    longitude: ARGENTINA_VIEW.center[0],
    latitude: ARGENTINA_VIEW.center[1],
    zoom: ARGENTINA_VIEW.zoom,
  },
  {
    id: "fuego",
    label: "Tierra del Fuego",
    longitude: -67.759,
    latitude: -54.638,
    zoom: 6.2,
  },
  {
    id: "malvinas",
    label: "Islas Malvinas",
    longitude: -59.4,
    latitude: -51.75,
    zoom: 6,
  },
  {
    id: "georgias",
    label: "Georgias del Sur",
    longitude: -36.5556,
    latitude: -54.4408,
    zoom: 6.5,
  },
];
