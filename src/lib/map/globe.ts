import { type Map as MapLibreMap, type Marker, type SkySpecification } from "maplibre-gl";
import { markerVisualScale } from "@/lib/map/marker-lod";

export type PlanetMode = "globe" | "mercator";

/** Preferencia de la sesión. No forma parte del progreso de la Pokédex. */
export const PLANET_SESSION_KEY = "pokeradar.projection.v1";

/** Por debajo de este zoom, la acción «Ver Argentina» queda a la vista. */
export const ARGENTINA_APPROACH_ZOOM = 2.4;

/**
 * Cielo nativo. El azul del horizonte es la atmósfera; se apaga al acercarse
 * para no velar el mapa detallado. MapLibre pasa de globo a Mercator cerca del zoom 11.
 */
export const PLANET_SKY: SkySpecification = {
  "sky-color": "rgba(4, 10, 22, 0)",
  "horizon-color": "#7fd4e8",
  "sky-horizon-blend": 0.55,
  "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.86, 2, 0.7, 6, 0.22, 11, 0],
  "horizon-fog-blend": 0.2,
  "fog-color": "#12384c",
};

export function readPlanetMode(): PlanetMode {
  if (typeof window === "undefined") {
    return "globe";
  }
  try {
    return sessionStorage.getItem(PLANET_SESSION_KEY) === "mercator" ? "mercator" : "globe";
  } catch {
    return "globe";
  }
}

export function writePlanetMode(mode: PlanetMode): void {
  try {
    sessionStorage.setItem(PLANET_SESSION_KEY, mode);
  } catch {
    // La sesión puede bloquear el almacenamiento. La elección sigue en memoria.
  }
}

/**
 * El radio en pantalla es el ancho del mundo dividido por 2π, y crece con la latitud.
 * El diámetro buscado es cerca del 74 % del lado corto, para que el limbo se vea.
 */
export function globeHomeZoom(width: number, height: number): number {
  const span = Math.min(width, height);
  const diameter = Math.min(Math.max(span * 0.74, 280), 860);
  const cosine = Math.cos((38.42 * Math.PI) / 180);
  const zoom = Math.log2((diameter * Math.PI * cosine) / 512);
  const clamped = Math.min(2.05, Math.max(1.15, zoom));
  return Math.round(clamped * 100) / 100;
}

export function applyPlanet(map: MapLibreMap, mode: PlanetMode): PlanetMode {
  const center = map.getCenter();
  const camera = {
    center: [center.lng, center.lat] as [number, number],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
  let applied: PlanetMode = "mercator";
  try {
    map.setProjection({ type: mode });
    applied = map.getProjection()?.type === "globe" ? "globe" : "mercator";
    if (mode === "globe" && applied !== "globe") {
      map.setProjection({ type: "mercator" });
    }
  } catch (error) {
    console.warn("La proyección globe no quedó disponible. Se usa el mapa plano.", error);
    try {
      map.setProjection({ type: "mercator" });
    } catch {
      // El estilo todavía no acepta proyección.
    }
    applied = "mercator";
  }
  try {
    map.setSky(PLANET_SKY);
  } catch (error) {
    console.warn("El cielo del globo no se aplicó.", error);
  }
  // Cambiar de proyección pasa por Mercator y, si el mundo no entra, mueve el centro.
  try {
    map.jumpTo(camera);
  } catch (error) {
    console.warn("La cámara no se pudo conservar al cambiar la proyección.", error);
  }
  return applied;
}

type PlacedMarker = Pick<Marker, "getElement">;

/**
 * Ajusta solo la escala del símbolo interno.
 * MapLibre conserva el transform del contenedor y marca el reverso con `maplibregl-marker-covered`.
 */
export function frameFieldMarkers(map: MapLibreMap, markers: readonly PlacedMarker[]): void {
  const scale = markerVisualScale(map.getZoom()).toFixed(2);
  for (const marker of markers) {
    marker.getElement().style.setProperty("--pin-scale", scale);
  }
}
