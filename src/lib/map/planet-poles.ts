/**
 * El globo de MapLibre 6.18 tapa el polo con triángulos que salen de la
 * última fila Mercator (85.05°). Si esa fila cambia de este a oeste, el
 * casquete se ve como un abanico. Estas filas quedan planas y constantes
 * para que el abanico no tenga variación. El resto de la tesela no se toca.
 */

const TERRARIUM_BIAS = 32768;

/**
 * Filas del borde, la misma cota en todas las teselas.
 * El abanico del globo y la primera celda de la malla (8 px) leen esta zona.
 * No se alarga: más filas tapan la batimetría real con un círculo.
 */
export const POLAR_FLAT_ROWS = 8;

/** El interior no se interpola. Una rampa hacia el dato real dibuja un anillo. */
export const POLAR_EASE_ROWS = 0;

/** Filas del borde que se reescriben. El resto de la tesela queda igual. */
export const POLAR_BLEND_ROWS = POLAR_FLAT_ROWS + POLAR_EASE_ROWS;

/**
 * Por encima del mar el velo batimétrico es transparente y el agua de abajo,
 * ya continua, queda a la vista. La misma cota en todas las teselas evita
 * que cada una abra una tajada.
 */
export const NORTH_CAP_ELEVATION = 40;

/**
 * Hielo parejo. El sombreado de un plano, con la luz a 30°, no pinta el casquete.
 */
export const SOUTH_CAP_ELEVATION = 2400;

export function isPolarDemTile(zoom: number, y: number): boolean {
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 22 || !Number.isInteger(y)) {
    return false;
  }
  return y === 0 || y === (1 << zoom) - 1;
}

export function decodeTerrarium(red: number, green: number, blue: number): number {
  return red * 256 + green + blue / 256 - TERRARIUM_BIAS;
}

export function encodeTerrarium(elevation: number, target: Uint8ClampedArray, offset: number): void {
  const scaled = Math.round((elevation + TERRARIUM_BIAS) * 256);
  const packed = Math.max(0, Math.min(0xffffff, scaled));
  target[offset] = (packed >> 16) & 255;
  target[offset + 1] = (packed >> 8) & 255;
  target[offset + 2] = packed & 255;
  target[offset + 3] = 255;
}

/**
 * Deja el borde polar en una sola cota, igual en todas las teselas.
 * El abanico deja de tener variación este-oeste. El interior no se toca,
 * así la batimetría y el relieve reales siguen donde el globo no los estira.
 * `north` indica que la fila 0 es el polo.
 */
export function flattenPolarDem(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  north: boolean,
): void {
  const span = POLAR_FLAT_ROWS;
  if (width < 2 || height <= span + 1) {
    return;
  }
  const cap = north ? NORTH_CAP_ELEVATION : SOUTH_CAP_ELEVATION;
  for (let row = 0; row < span; row += 1) {
    const y = north ? row : height - 1 - row;
    for (let x = 0; x < width; x += 1) {
      encodeTerrarium(cap, pixels, (y * width + x) * 4);
    }
  }
}
