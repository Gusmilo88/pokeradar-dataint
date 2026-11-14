"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PokeBall } from "@/components/expedition/poke-ball";
import type { CaptureAccentId } from "@/lib/expedition/capture-accent";
import { blackWhiteStill } from "@/lib/pokeapi/sprites";
import "./capture-stage.css";

export type CaptureReel = "throw" | "absorb" | "drop" | "resist" | "flash" | "still";

export function CaptureStage({
  reel,
  step,
  steps,
  difficulty,
  announcement,
  label,
  nationalId,
  stillUrl,
  animatedUrl,
  accent,
  reduced,
  done,
  soundOn,
  onToggleSound,
  onSkip,
  onCancel,
  onNext,
}: {
  reel: CaptureReel;
  step: number;
  steps: number;
  difficulty: string;
  announcement: string;
  label: string;
  nationalId: number;
  stillUrl: string | null;
  animatedUrl: string | null;
  accent: CaptureAccentId | null;
  reduced: boolean;
  done: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  onSkip: () => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  const titleId = useId();
  const skipRef = useRef<HTMLButtonElement>(null);
  const still = stillUrl || blackWhiteStill(nationalId);
  const animated = animatedUrl;
  const [shown, setShown] = useState(reduced || !animated ? still : animated);

  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  function trapTab(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") {
      return;
    }
    const buttons = [...event.currentTarget.querySelectorAll("button")];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="capture-stage"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-reel={reel}
      data-steps={steps}
      data-accent={accent ?? undefined}
      data-capture={done ? "done" : "running"}
      onKeyDown={trapTab}
    >
      <div className="capture-scene">
        {/* El sprite sale del repositorio de PokéAPI. next/image pediría un remotePattern. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shown}
          alt=""
          width={96}
          height={96}
          className="capture-creature pixel-sprite"
          onError={() => {
            if (shown !== still) {
              setShown(still);
            }
          }}
        />
        <div className="capture-sparks" aria-hidden="true">
          <span className="capture-spark" />
          <span className="capture-spark" />
          <span className="capture-spark" />
          <span className="capture-spark" />
          <span className="capture-spark" />
          <span className="capture-spark" />
        </div>
        <div key={`${reel}-${step}`} className="capture-ball-rig">
          <PokeBall />
        </div>
        <span className="capture-flash" aria-hidden="true" />
        <span className="capture-ring" aria-hidden="true" />
      </div>
      <div className="capture-copy">
        <p className="font-mono text-[10px] tracking-[0.16em] text-phosphor uppercase" data-capture="difficulty">
          {difficulty}
        </p>
        <p id={titleId} className="sr-only">
          Captura de {label}
        </p>
        <p className="mt-2 text-sm text-ink" aria-live="polite">
          {announcement}
        </p>
        {done ? <h2 className="capture-banner">¡Capturado!</h2> : null}
      </div>
      <div className="capture-actions">
        {reduced && !done ? (
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={onNext}>
            Siguiente
          </button>
        ) : null}
        {done ? null : (
          <button
            ref={skipRef}
            type="button"
            className="action-button inline-flex items-center justify-center"
            onClick={onSkip}
          >
            Omitir secuencia
          </button>
        )}
        {done ? null : (
          <button
            type="button"
            className="action-button inline-flex items-center justify-center opacity-70"
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          className="action-button inline-flex items-center justify-center"
          aria-pressed={soundOn}
          onClick={onToggleSound}
        >
          {soundOn ? "Sonido" : "Silencio"}
        </button>
      </div>
    </div>
  );
}
