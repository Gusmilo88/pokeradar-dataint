import collection from "@/lib/map/argentina-land.json";

/**
 * Natural Earth 5.1.2, producto cultural `ne_50m_admin_0_countries`.
 * Dominio público. Se extrajo el feature ADM0_A3 = ARG.
 * 1039 vértices. Las coordenadas se redondearon a 4 decimales (cerca de 11 m).
 * No se aplicó otra simplificación: la generalización es la de la escala 1:50.000.000.
 *
 * Limitaciones: no sirve para catastro ni para un límite legal.
 * Islas Malvinas (FLK) y Georgias del Sur (SGS) son features aparte en esta fuente.
 * Natural Earth anota Malvinas como administradas por el Reino Unido y reclamadas por Argentina.
 * Este mapa no fusiona ese feature ni dibuja el sector antártico, que no está en el polígono ARG.
 */
export const ARGENTINA_LAND_NOTE =
  "Contorno de Natural Earth 5.1.2 (admin-0, 1:50.000.000). Malvinas y el sector antártico no forman parte de este polígono.";

export const ARGENTINA_LAND = collection;
