import type { PokemonHabitatName } from "@/lib/pokeapi/types";

/**
 * Hábitats geográficos. `rare` existe en PokéAPI pero no es un lugar,
 * así que ninguna zona lo usa.
 */
export type ExpeditionHabitat = Exclude<PokemonHabitatName, "rare">;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ZonePlacement {
  spreadKm: number;
  /** Grados desde el norte, en sentido horario. */
  bearingDeg: number;
  bearingSpanDeg: number;
}

export interface ExpeditionZone {
  id: string;
  name: string;
  region: string;
  summary: string;
  habitat: ExpeditionHabitat;
  anchor: GeoPoint;
  /**
   * Cuña alrededor del ancla. Evita soltar encuentros de hábitats terrestres
   * sobre el agua conocida de esa zona.
   */
  placement: ZonePlacement;
}

/**
 * Contacto futuro. La especie se resuelve con PokéAPI;
 * la coordenada la va a producir el generador con semilla, no esta lista.
 */
export interface Sighting {
  id: string;
  speciesName: string;
  zoneId: string;
  latitude: number;
  longitude: number;
}

export const HABITAT_LABEL: Record<ExpeditionHabitat, string> = {
  cave: "Cueva",
  forest: "Bosque",
  grassland: "Pastizal",
  mountain: "Montaña",
  "rough-terrain": "Terreno áspero",
  sea: "Mar",
  urban: "Urbano",
  "waters-edge": "Orilla",
};

/**
 * Vista inicial. El centro es [longitud, latitud], el orden de MapLibre.
 */
export const ARGENTINA_VIEW: {
  center: [number, number];
  zoom: number;
} = {
  center: [-64.18, -38.42],
  zoom: 3.8,
};

/**
 * Anclas de simulación, no avistamientos.
 * Coordenadas del geocoder de Open-Meteo (countryCode=AR) el 2026-11-13.
 * La membresía de especies sale después de GET /pokemon-habitat/{habitat}.
 */
export const EXPEDITION_ZONES: readonly ExpeditionZone[] = [
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    region: "Ciudad Autónoma de Buenos Aires",
    habitat: "urban",
    anchor: { latitude: -34.61315, longitude: -58.37723 },
    placement: { spreadKm: 4.5, bearingDeg: 270, bearingSpanDeg: 90 },
    summary: "Ciudad capital. El hábitat urban se consulta en PokéAPI al generar contactos. La cuña mira al oeste, tierra adentro del Río de la Plata.",
  },
  {
    id: "puerto-iguazu",
    name: "Puerto Iguazú",
    region: "Misiones",
    habitat: "forest",
    anchor: { latitude: -25.59912, longitude: -54.57355 },
    placement: { spreadKm: 7, bearingDeg: 230, bearingSpanDeg: 80 },
    summary: "Selva paranaense. El ancla usa forest, el hábitat más cercano que publica la API. La cuña entra al parque, lejos del río fronterizo.",
  },
  {
    id: "cataratas-iguazu",
    name: "Cataratas del Iguazú",
    region: "Misiones",
    habitat: "waters-edge",
    anchor: { latitude: -25.68988, longitude: -54.44369 },
    placement: { spreadKm: 1.6, bearingDeg: 190, bearingSpanDeg: 50 },
    summary: "Agua en movimiento. El ancla usa waters-edge. La cuña queda del lado argentino de las cataratas.",
  },
  {
    id: "ibera",
    name: "Colonia Carlos Pellegrini",
    region: "Corrientes",
    habitat: "grassland",
    anchor: { latitude: -28.53603, longitude: -57.17321 },
    placement: { spreadKm: 3.5, bearingDeg: 0, bearingSpanDeg: 360 },
    summary: "Portal del Iberá. PokéAPI no tiene estero; el ancla usa grassland. El radio corto se queda junto al pueblo, no en las lagunas abiertas.",
  },
  {
    id: "aconcagua",
    name: "Aconcagua",
    region: "Mendoza",
    habitat: "mountain",
    anchor: { latitude: -32.65383, longitude: -70.01141 },
    placement: { spreadKm: 4, bearingDeg: 0, bearingSpanDeg: 360 },
    summary: "Alta montaña. Hábitat mountain.",
  },
  {
    id: "perito-moreno",
    name: "Glaciar Perito Moreno",
    region: "Santa Cruz",
    habitat: "mountain",
    anchor: { latitude: -50.47324, longitude: -73.0481 },
    placement: { spreadKm: 3.5, bearingDeg: 260, bearingSpanDeg: 80 },
    summary: "Hielo. PokéAPI no tiene hábitat de glaciar; el ancla usa mountain. La cuña mira al glaciar, no al Lago Argentino.",
  },
  {
    id: "puerto-piramides",
    name: "Puerto Pirámides",
    region: "Chubut",
    habitat: "sea",
    anchor: { latitude: -42.57212, longitude: -64.28436 },
    placement: { spreadKm: 3, bearingDeg: 80, bearingSpanDeg: 60 },
    summary: "Costa de Península Valdés. Hábitat sea. Los encuentros entran unos kilómetros al Golfo Nuevo, no al Atlántico abierto.",
  },
  {
    id: "puna",
    name: "San Antonio de los Cobres",
    region: "Salta",
    habitat: "rough-terrain",
    anchor: { latitude: -24.22131, longitude: -66.32025 },
    placement: { spreadKm: 6, bearingDeg: 0, bearingSpanDeg: 360 },
    summary: "Puna. Hábitat rough-terrain.",
  },
  {
    id: "caverna-brujas",
    name: "Caverna de las Brujas",
    region: "Mendoza",
    habitat: "cave",
    anchor: { latitude: -35.80198, longitude: -69.81935 },
    placement: { spreadKm: 1.2, bearingDeg: 0, bearingSpanDeg: 360 },
    summary: "Caverna en Malargüe. Hábitat cave.",
  },
  {
    id: "mar-del-plata",
    name: "Mar del Plata",
    region: "Buenos Aires",
    habitat: "waters-edge",
    anchor: { latitude: -38.00042, longitude: -57.5562 },
    placement: { spreadKm: 3.5, bearingDeg: 280, bearingSpanDeg: 70 },
    summary: "Costa atlántica. Hábitat waters-edge. La cuña se queda en la ciudad, al oeste del océano.",
  },
];
