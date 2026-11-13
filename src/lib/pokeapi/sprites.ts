/**
 * Rutas del repositorio PokeAPI/sprites, generación V, Black & White.
 * Son las mismas que publica /pokemon/{id} en
 * sprites.versions["generation-v"]["black-white"].
 * El id es el nacional. No se descarga el repositorio.
 */
const BLACK_WHITE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white";

export function blackWhiteStill(nationalId: number): string {
  return `${BLACK_WHITE}/${nationalId}.png`;
}

export function blackWhiteAnimated(nationalId: number): string {
  return `${BLACK_WHITE}/animated/${nationalId}.gif`;
}
