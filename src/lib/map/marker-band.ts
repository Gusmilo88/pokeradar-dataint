import { REGIONAL_ZOOM } from "@/lib/expedition/pins";

export type MarkerBand = "global" | "regional" | "detail";

/** El detalle sigue en 6.5. El salto a nombres depende del lado corto de la ventana. */
export function markerBand(zoom: number, shortSide: number): MarkerBand {
  const names = shortSide < 720 ? 2.6 : 3.6;
  if (zoom >= REGIONAL_ZOOM) {
    return "detail";
  }
  if (zoom >= names) {
    return "regional";
  }
  return "global";
}
