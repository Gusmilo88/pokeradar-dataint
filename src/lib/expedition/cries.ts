import { readCaptureAudio } from "@/lib/expedition/capture-audio";
import type { PokemonCries } from "@/lib/pokeapi/types";

export const CRY_VOLUME = 0.4;

let current: HTMLAudioElement | null = null;
let currentKey = "";

export function crySource(cries: PokemonCries | null): { first: string | null; fallback: string | null } {
  if (!cries) {
    return { first: null, fallback: null };
  }
  if (cries.latest) {
    return { first: cries.latest, fallback: cries.legacy };
  }
  return { first: cries.legacy, fallback: null };
}

export function stopCry(): void {
  current?.pause();
  if (current) {
    current.src = "";
  }
  current = null;
  currentKey = "";
}

/** Un mismo key en curso no vuelve a sonar. `force` corta el anterior. */
export function playSpeciesCry(cries: PokemonCries | null, key: string, force = false): void {
  if (!readCaptureAudio()) {
    return;
  }
  const source = crySource(cries);
  if (!source.first) {
    return;
  }
  if (!force && currentKey === key && current && !current.paused && !current.ended) {
    return;
  }
  stopCry();
  const audio = new Audio(source.first);
  audio.volume = CRY_VOLUME;
  current = audio;
  currentKey = key;
  let triedFallback = false;
  audio.addEventListener("error", () => {
    if (current !== audio || triedFallback || !source.fallback) {
      if (current === audio) {
        stopCry();
      }
      return;
    }
    triedFallback = true;
    audio.src = source.fallback;
    void audio.play().catch(() => {
      if (current === audio) {
        stopCry();
      }
    });
  });
  void audio.play().catch(() => {
    if (current === audio) {
      stopCry();
    }
  });
}
