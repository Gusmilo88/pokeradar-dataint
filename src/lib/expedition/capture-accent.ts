/**
 * Acento visual de los seis reservados. No entra en la dificultad.
 * Los encuentros de campo usan el destello neutro.
 */
export const CAPTURE_ACCENTS = {
  "kanto-144": { id: "ice", label: "Hielo" },
  "kanto-145": { id: "spark", label: "Electricidad" },
  "kanto-146": { id: "flame", label: "Fuego" },
  "kanto-142": { id: "fossil", label: "Fósil" },
  "kanto-150": { id: "mind", label: "Energía psíquica" },
  "kanto-151": { id: "grove", label: "Esmeralda" },
} as const;

export type CaptureAccentId = (typeof CAPTURE_ACCENTS)[keyof typeof CAPTURE_ACCENTS]["id"];

export function captureAccent(encounterId: string): CaptureAccentId | null {
  const accent = CAPTURE_ACCENTS[encounterId as keyof typeof CAPTURE_ACCENTS];
  return accent ? accent.id : null;
}
