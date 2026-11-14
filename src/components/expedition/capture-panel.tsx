"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/a11y/motion";
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

const BEAT_MS = 700;

export function CapturePanel({
  encounterId,
  captureRate,
  baseStats,
  state,
  onCaptured,
}: {
  encounterId: string;
  captureRate: number;
  baseStats: readonly number[];
  state: "seen" | "caught";
  onCaptured: (encounterId: string) => void;
}) {
  const difficulty = captureDifficulty(captureRate, baseStats);
  const label = difficulty === null ? null : resistanceLabel(difficulty);
  const [run, setRun] = useState<CaptureRun>({ status: "idle" });
  const [manual, setManual] = useState(false);
  const committed = useRef(false);
  const lock = useRef(false);
  const onCapturedRef = useRef(onCaptured);
  const runRef = useRef(run);

  useEffect(() => {
    onCapturedRef.current = onCaptured;
  }, [onCaptured]);

  useEffect(() => {
    runRef.current = run;
    if (run.status !== "running" || manual) {
      return;
    }
    const timer = window.setTimeout(() => {
      const current = runRef.current;
      if (current.status !== "running") {
        return;
      }
      setRun(accept(stepCapture(current)));
    }, BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [manual, run]);

  function accept(next: CaptureRun): CaptureRun {
    if (next.status !== "done" || committed.current) {
      return next;
    }
    committed.current = true;
    try {
      onCapturedRef.current(next.encounterId);
      return next;
    } catch {
      committed.current = false;
      lock.current = false;
      return { status: "aborted", encounterId: next.encounterId, reason: "save" };
    }
  }

  if (state === "caught" || run.status === "done") {
    return (
      <div className="capture-panel pointer-events-auto mt-4 border border-amber/40 bg-abyss/80 px-3 py-3" data-capture="done">
        <p className="font-mono text-[10px] tracking-[0.16em] text-amber uppercase">Capturado</p>
        <p className="mt-1 text-sm text-ink">La captura quedó registrada.</p>
      </div>
    );
  }

  if (difficulty === null || label === null) {
    return (
      <p className="pointer-events-auto mt-4 text-sm text-quiet" role="status" data-capture="unavailable">
        La dificultad no está disponible. No se registró una captura.
      </p>
    );
  }

  const level = difficulty;

  function start() {
    if (lock.current || committed.current) {
      return;
    }
    const next = beginCapture(encounterId, level);
    if (!next) {
      return;
    }
    lock.current = true;
    setManual(prefersReducedMotion());
    setRun(next);
  }

  const beat = run.status === "running" ? (CAPTURE_BEATS[run.step] ?? CAPTURE_BEATS[0]) : null;

  return (
    <div className="capture-panel pointer-events-auto mt-4 border border-phosphor/25 bg-abyss/80 px-3 py-3">
      <p className="text-sm text-ink" data-capture="difficulty">
        {label}
      </p>
      {run.status === "running" ? (
        <div className="mt-3" aria-live="polite" data-capture="running">
          <p className="font-mono text-[10px] tracking-[0.14em] text-phosphor uppercase">
            Captura en curso. Movimiento {run.step + 1} de {run.steps}.
          </p>
          <p className="mt-1 text-sm text-quiet">{beat}</p>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {Array.from({ length: run.steps }, (_, index) => (
              <span
                key={index}
                className={index <= run.step ? "h-1 flex-1 bg-amber" : "h-1 flex-1 bg-phosphor/20"}
              />
            ))}
          </div>
        </div>
      ) : null}
      {run.status === "aborted" ? (
        <p className="mt-3 text-sm text-quiet" role={run.reason === "save" ? "alert" : "status"}>
          {run.reason === "save"
            ? "No se pudo guardar la captura."
            : "La captura se interrumpió. Sigue visto."}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {run.status === "running" ? (
          <>
            {manual ? (
              <button
                type="button"
                className="action-button inline-flex items-center justify-center"
                onClick={() => {
                  const current = runRef.current;
                  if (current.status !== "running") {
                    return;
                  }
                  setRun(accept(stepCapture(current)));
                }}
              >
                Siguiente
              </button>
            ) : null}
            <button
              type="button"
              className="action-button inline-flex items-center justify-center"
              onClick={() => {
                const current = runRef.current;
                if (current.status !== "running") {
                  return;
                }
                setRun(accept(finishCapture(current)));
              }}
            >
              Omitir secuencia
            </button>
            <button
              type="button"
              className="action-button inline-flex items-center justify-center opacity-70"
              onClick={() => {
                lock.current = false;
                setRun((current) => (current.status === "running" ? abortCapture(current) : current));
              }}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            className="action-button inline-flex items-center justify-center"
            onClick={start}
            data-capture="start"
          >
            Atrapar
          </button>
        )}
      </div>
    </div>
  );
}
