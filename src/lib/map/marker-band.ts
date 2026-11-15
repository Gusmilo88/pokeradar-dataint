import { markerLod } from "@/lib/map/marker-lod";

export type MarkerBand = "global" | "regional" | "detail";

/**
 * Tres bandas, alineadas con la distancia del globo.
 * `shortSide` se conserva para los llamadores; la banda ya no cambia con el ancho.
 */
export function markerBand(zoom: number, shortSide?: number): MarkerBand {
  void shortSide;
  const lod = markerLod(zoom);
  if (lod === "near") {
    return "detail";
  }
  if (lod === "mid") {
    return "regional";
  }
  return "global";
}
