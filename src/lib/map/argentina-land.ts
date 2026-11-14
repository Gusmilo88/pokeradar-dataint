import collection from "@/lib/map/argentina-land.json";

/**
 * Natural Earth 5.1.2, producto cultural `ne_50m_admin_0_countries`.
 * Dominio público. Se extrajo el feature ADM0_A3 = ARG.
 * 1039 vértices. Las coordenadas se redondearon a 4 decimales (cerca de 11 m).
 * No se aplicó otra simplificación: la generalización es la de la escala 1:50.000.000.
 *
 * Limitaciones: no sirve para catastro ni para un límite legal.
 * Malvinas (FLK) y Georgias y Sandwich del Sur (SGS) no están en este polígono.
 * Esos contornos salen del extracto 1:10.000.000 y se dibujan como features aparte.
 * No incluye el sector antártico.
 */
export const ARGENTINA_LAND_NOTE =
  "Contornos de Natural Earth 5.1.2. Argentina, 1:50.000.000. Malvinas, Georgias del Sur y Sandwich del Sur, 1:10.000.000, en polígonos aparte.";

export const ARGENTINA_LAND = collection;
