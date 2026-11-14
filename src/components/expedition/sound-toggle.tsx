"use client";

import { primeCaptureAudio, writeCaptureAudio } from "@/lib/expedition/capture-audio";
import { stopCry } from "@/lib/expedition/cries";
import { useSoundEnabled } from "@/components/expedition/use-sound";

function Speaker({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path className="speaker-body" d="M4 9.2h3.2L12 5v14l-4.8-4.2H4z" />
      {muted ? (
        <path className="speaker-mark" d="M16 8.5l6 7M22 8.5l-6 7" />
      ) : (
        <>
          <path className="speaker-mark" d="M15.5 9.2a3.2 3.2 0 0 1 0 5.6" />
          <path className="speaker-mark" d="M18 6.6a6.2 6.2 0 0 1 0 10.8" />
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
      className="game-icon sound-toggle"
      data-audio={enabled ? "on" : "off"}
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
