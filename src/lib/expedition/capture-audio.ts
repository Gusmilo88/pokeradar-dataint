import { prefersReducedMotion } from "@/lib/a11y/motion";

/**
 * Tonos sintetizados en el navegador con Web Audio.
 * PokéAPI publica el grito de la especie, no el lanzamiento ni la Pokébola.
 * No hay samples comerciales.
 */
export const CAPTURE_AUDIO_KEY = "pokeradar.audio.v1";

export const CAPTURE_CUES = ["throw", "absorb", "shake", "success"] as const;

export type CaptureCue = (typeof CAPTURE_CUES)[number];

type Stoppable = { stop: () => void };

let context: AudioContext | null = null;
let active: Stoppable | null = null;
let ticket = 0;

export const CAPTURE_AUDIO_EVENT = "pokeradar-audio";

export function readCaptureAudio(): boolean {
  try {
    if (typeof window === "undefined") {
      return true;
    }
    return window.sessionStorage.getItem(CAPTURE_AUDIO_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeCaptureAudio(enabled: boolean): void {
  try {
    window.sessionStorage.setItem(CAPTURE_AUDIO_KEY, enabled ? "on" : "off");
    window.dispatchEvent(new Event(CAPTURE_AUDIO_EVENT));
  } catch {
    return;
  }
  if (!enabled) {
    stopCaptureAudio();
  }
}

export function stopCaptureAudio(): void {
  ticket += 1;
  active?.stop();
  active = null;
}

/** Crear o reanudar el contexto dentro del clic. Sin esto el navegador bloquea el audio. */
export function primeCaptureAudio(): void {
  const next = audioContext();
  if (!next) {
    return;
  }
  void next.resume();
}

export function playCaptureCue(cue: CaptureCue): void {
  if (!readCaptureAudio()) {
    return;
  }
  if (prefersReducedMotion() && cue !== "success") {
    return;
  }
  const audio = audioContext();
  if (!audio) {
    return;
  }
  void audio.resume();
  active?.stop();
  const mine = ticket + 1;
  ticket = mine;
  const started = audio.currentTime;
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, started);
  master.connect(audio.destination);

  if (cue === "throw") {
    whoosh(audio, master, started);
  } else if (cue === "absorb") {
    chime(audio, master, started, 620, 980, 0.22);
  } else if (cue === "shake") {
    tick(audio, master, started);
  } else {
    chime(audio, master, started, 523, 659, 0.16);
    chime(audio, master, started + 0.14, 659, 784, 0.22);
  }

  const stop = () => {
    const at = audio.currentTime;
    master.gain.cancelScheduledValues(at);
    master.gain.setTargetAtTime(0.0001, at, 0.02);
    window.setTimeout(() => master.disconnect(), 180);
  };
  active = { stop };
  window.setTimeout(() => {
    if (ticket === mine) {
      active = null;
      master.disconnect();
    }
  }, cue === "success" ? 700 : 420);
}

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  context ??= new Ctx();
  return context;
}

function whoosh(audio: AudioContext, master: GainNode, at: number): void {
  const length = Math.floor(audio.sampleRate * 0.18);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(420, at);
  filter.frequency.exponentialRampToValueAtTime(1400, at + 0.16);
  filter.Q.value = 0.7;
  noise.connect(filter);
  filter.connect(master);
  master.gain.setValueAtTime(0.0001, at);
  master.gain.exponentialRampToValueAtTime(0.16, at + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  noise.start(at);
  noise.stop(at + 0.2);
}

function chime(
  audio: AudioContext,
  master: GainNode,
  at: number,
  from: number,
  to: number,
  duration: number,
): void {
  const tone = audio.createOscillator();
  tone.type = "sine";
  tone.frequency.setValueAtTime(from, at);
  tone.frequency.exponentialRampToValueAtTime(to, at + duration);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.2, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  tone.connect(gain);
  gain.connect(master);
  master.gain.setValueAtTime(0.2, at);
  tone.start(at);
  tone.stop(at + duration + 0.02);
}

function tick(audio: AudioContext, master: GainNode, at: number): void {
  const tone = audio.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(196, at);
  tone.frequency.exponentialRampToValueAtTime(90, at + 0.12);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.28, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
  tone.connect(gain);
  gain.connect(master);
  master.gain.setValueAtTime(0.3, at);
  tone.start(at);
  tone.stop(at + 0.16);
}
