"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CaptureStage, type CaptureReel } from "@/components/expedition/capture-stage";
import { prefersReducedMotion } from "@/lib/a11y/motion";
import { captureAccent } from "@/lib/expedition/capture-accent";
import {
  CAPTURE_AUDIO_EVENT,
  playCaptureCue,
  primeCaptureAudio,
  readCaptureAudio,
  stopCaptureAudio,
  writeCaptureAudio,
} from "@/lib/expedition/capture-audio";
import {
  abortCapture,
  beginCapture,
  CAPTURE_BEATS,
  captureDifficulty,
  finishCapture,
  resistanceLabel,
  stepCapture,
  type CaptureRun,
} from "@/lib/expedition/capture";

const THROW_MS = 680;
const ABSORB_MS = 520;
const DROP_MS = 460;
const SHAKE_MS = 780;

export function CapturePanel({
  encounterId,
  captureRate,
  baseStats,
  state,
  nationalId,
  stillUrl,
  animatedUrl,
  label,
  onCaptured,
}: {
  encounterId: string;
  captureRate: number;
  baseStats: readonly number[];
  state: "seen" | "caught";
  nationalId: number;
  stillUrl: string | null;
  animatedUrl: string | null;
  label: string;
  onCaptured: (encounterId: string) => void;
}) {
  const difficulty = captureDifficulty(captureRate, baseStats);
  const difficultyLabel = difficulty === null ? null : resistanceLabel(difficulty);
  const [run, setRun] = useState<CaptureRun>({ status: "idle" });
  const [manual, setManual] = useState(false);
  const [reel, setReel] = useState<CaptureReel>("still");
  const [showFlash, setShowFlash] = useState(false);
  const soundOn = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CAPTURE_AUDIO_EVENT, onChange);
      return () => window.removeEventListener(CAPTURE_AUDIO_EVENT, onChange);
    },
    readCaptureAudio,
    () => true,
  );
  const committed = useRef(false);
  const lock = useRef(false);
  const successPlayed = useRef(false);
  const onCapturedRef = useRef(onCaptured);
  const runRef = useRef(run);
  const completeRef = useRef<(next: CaptureRun) => CaptureRun>((next) => next);
  const flashTimer = useRef<number | null>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    onCapturedRef.current = onCaptured;
  }, [onCaptured]);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) {
        window.clearTimeout(flashTimer.current);
      }
      stopCaptureAudio();
    };
  }, []);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    if (run.status !== "running" || manual) {
      return;
    }
    const cues: Array<{ reel: CaptureReel; cue: "absorb" | null; at: number }> = [
      { reel: "throw", cue: null, at: 0 },
      { reel: "absorb", cue: "absorb", at: THROW_MS },
      { reel: "drop", cue: null, at: THROW_MS + ABSORB_MS },
      { reel: "resist", cue: null, at: THROW_MS + ABSORB_MS + DROP_MS },
    ];
    const timers = cues.map((cue) =>
      window.setTimeout(() => {
        if (runRef.current.status !== "running") {
          return;
        }
        setReel(cue.reel);
        if (cue.cue) {
          playCaptureCue(cue.cue);
        }
      }, cue.at),
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [manual, run.status]);

  useEffect(() => {
    if (reel !== "resist" || run.status !== "running" || manual) {
      return;
    }
    playCaptureCue("shake");
    const timer = window.setTimeout(() => {
      const current = runRef.current;
      if (current.status !== "running") {
        return;
      }
      setRun(completeRef.current(stepCapture(current)));
    }, SHAKE_MS);
    return () => window.clearTimeout(timer);
  }, [manual, reel, run]);

  useEffect(() => {
    if (run.status !== "running") {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      cancel();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [run.status]);

  useEffect(() => {
    completeRef.current = complete;
  });

  function complete(next: CaptureRun): CaptureRun {
    if (next.status !== "done" || committed.current) {
      return next;
    }
    committed.current = true;
    try {
      onCapturedRef.current(next.encounterId);
    } catch {
      committed.current = false;
      lock.current = false;
      stopCaptureAudio();
      return { status: "aborted", encounterId: next.encounterId, reason: "save" };
    }
    setReel("flash");
    setShowFlash(true);
    if (!successPlayed.current) {
      successPlayed.current = true;
      playCaptureCue("success");
    }
    if (flashTimer.current !== null) {
      window.clearTimeout(flashTimer.current);
    }
    flashTimer.current = window.setTimeout(() => {
      setShowFlash(false);
      flashTimer.current = null;
    }, manual ? 500 : 1200);
    return next;
  }

  function cancel() {
    if (runRef.current.status !== "running") {
      return;
    }
    lock.current = false;
    stopCaptureAudio();
    setReel("still");
    setRun(abortCapture(runRef.current));
    window.setTimeout(() => startRef.current?.focus(), 0);
  }

  if (difficulty === null || difficultyLabel === null) {
    return (
      <p className="pointer-events-auto mt-4 text-sm text-quiet" role="status" data-capture="unavailable">
        La dificultad no está disponible. No se registró una captura.
      </p>
    );
  }

  const level = difficulty;
  const stageOpen = run.status === "running" || (run.status === "done" && showFlash);
  const beat = run.status === "running" ? (CAPTURE_BEATS[run.step] ?? CAPTURE_BEATS[0]) : null;
  const announcement =
    run.status === "done" || reel === "flash"
      ? "¡Capturado!"
      : reel === "throw"
        ? "Lanzamiento."
        : reel === "absorb"
          ? "La criatura entra en la Pokébola."
          : reel === "drop"
            ? "La Pokébola cae."
            : run.status === "running"
              ? `Captura en curso. Movimiento ${run.step + 1} de ${run.steps}. ${beat ?? ""}`
              : difficultyLabel;

  function start() {
    if (lock.current || committed.current) {
      return;
    }
    const next = beginCapture(encounterId, level);
    if (!next) {
      return;
    }
    lock.current = true;
    successPlayed.current = false;
    const calm = prefersReducedMotion();
    setManual(calm);
    setShowFlash(false);
    setReel(calm ? "still" : "throw");
    primeCaptureAudio();
    if (!calm) {
      playCaptureCue("throw");
    }
    setRun(next);
  }

  function toggleSound() {
    writeCaptureAudio(!readCaptureAudio());
  }

  return (
    <>
      {stageOpen ? (
        <CaptureStage
          reel={manual ? "still" : reel}
          step={run.status === "running" ? run.step : 0}
          steps={run.status === "running" ? run.steps : level <= 5 ? 3 : 4}
          difficulty={difficultyLabel}
          announcement={announcement}
          label={label}
          nationalId={nationalId}
          stillUrl={stillUrl}
          animatedUrl={animatedUrl}
          accent={captureAccent(encounterId)}
          reduced={manual}
          done={run.status === "done"}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          onSkip={() => {
            const current = runRef.current;
            if (current.status !== "running") {
              return;
            }
            setRun(complete(finishCapture(current)));
          }}
          onCancel={cancel}
          onNext={() => {
            const current = runRef.current;
            if (current.status !== "running") {
              return;
            }
            setRun(complete(stepCapture(current)));
          }}
        />
      ) : null}
      <div className="capture-panel pointer-events-auto mt-4 border border-phosphor/25 bg-abyss/80 px-3 py-3">
        {stageOpen ? (
          <p className="text-sm text-quiet">Captura en curso.</p>
        ) : state === "caught" || run.status === "done" ? (
          <div data-capture="done">
            <p className="font-mono text-[10px] tracking-[0.16em] text-amber uppercase">¡Capturado!</p>
            <p className="mt-1 text-sm text-ink">La captura quedó registrada.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink" data-capture="difficulty">
              {difficultyLabel}
            </p>
            {run.status === "aborted" ? (
              <p className="mt-3 text-sm text-quiet" role={run.reason === "save" ? "alert" : "status"}>
                {run.reason === "save"
                  ? "No se pudo guardar la captura."
                  : "La captura se interrumpió. Sigue visto."}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                ref={startRef}
                type="button"
                className="action-button inline-flex items-center justify-center"
                onClick={start}
                data-capture="start"
              >
                Atrapar
              </button>
              <button
                type="button"
                className="action-button inline-flex items-center justify-center"
                aria-pressed={soundOn}
                onClick={toggleSound}
              >
                {soundOn ? "Sonido" : "Silencio"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
