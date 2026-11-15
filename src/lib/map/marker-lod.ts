import { REGIONAL_ZOOM } from "@/lib/expedition/pins";

/** Por debajo de este zoom el globo se lee en compacto. */
export const FAR_ZOOM = 2.4;

export type MarkerLod = "far" | "mid" | "near";

/**
 * Lejos: sellos compactos. Medio: zonas legibles. Cerca: encuentros.
 * El umbral cercano sigue siendo el zoom regional.
 */
export function markerLod(zoom: number): MarkerLod {
  if (zoom >= REGIONAL_ZOOM) {
    return "near";
  }
  if (zoom >= FAR_ZOOM) {
    return "mid";
  }
  return "far";
}

/** Escala visual continua. No baja de 0.78 para que el sello no se vuelva un punto ciego. */
export function markerVisualScale(zoom: number): number {
  if (zoom >= REGIONAL_ZOOM) {
    return 1;
  }
  if (zoom >= FAR_ZOOM) {
    const span = REGIONAL_ZOOM - FAR_ZOOM;
    const progress = (zoom - FAR_ZOOM) / span;
    return Math.round((0.9 + progress * 0.1) * 100) / 100;
  }
  const start = 1.15;
  if (zoom <= start) {
    return 0.78;
  }
  const progress = (zoom - start) / (FAR_ZOOM - start);
  return Math.round((0.78 + progress * 0.12) * 100) / 100;
}
