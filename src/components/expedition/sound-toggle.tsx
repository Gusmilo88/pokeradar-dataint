"use client";

import { primeCaptureAudio, writeCaptureAudio } from "@/lib/expedition/capture-audio";
import { stopCry } from "@/lib/expedition/cries";
import { useSoundEnabled } from "@/components/expedition/use-sound";

function Speaker({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h3l4-3v10l-4-3H4z" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" />
      ) : (
        <>
          <path d="M16 9.5a3 3 0 0 1 0 5" />
          <path d="M18.5 7a6 6 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

export function SoundToggle() {
  const enabled = useSoundEnabled();
  const label = enabled ? "Silenciar" : "Activar sonido";
  return (
    <button
      type="button"
      className="game-icon"
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      onClick={() => {
        primeCaptureAudio();
        if (enabled) {
          stopCry();
        }
        writeCaptureAudio(!enabled);
      }}
    >
      <Speaker muted={!enabled} />
    </button>
  );
}
