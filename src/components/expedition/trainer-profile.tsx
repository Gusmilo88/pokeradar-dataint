"use client";

import { useEffect, useId, useRef } from "react";
import { EXPEDITION_SIZE } from "@/lib/expedition/kanto";
import {
  CARD_FINISHES,
  plateForLevel,
  rankForLevel,
  type CardFinishId,
} from "@/lib/expedition/trainer-rewards";
import type { TrainerLevelProgress } from "@/lib/expedition/trainer-xp";
import "./trainer-profile.css";

export function TrainerProfile({
  progress,
  caught,
  inspected,
  onInspect,
  onClose,
}: {
  progress: TrainerLevelProgress | null;
  caught: number;
  inspected: CardFinishId;
  onInspect: (id: CardFinishId) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const rank = progress ? rankForLevel(progress.level) : null;
  const plate = progress ? plateForLevel(progress.level) : "base";
  const detail = CARD_FINISHES.find((finish) => finish.id === inspected) ?? CARD_FINISHES[0];

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const nextLine = !progress
    ? "La XP de expedición no está completa."
    : progress.atCap
      ? "Nivel máximo de la expedición."
      : `Faltan ${progress.xpToNext} XP para el nivel ${progress.nextLevel ?? progress.level}.`;

  return (
    <div className="trainer-profile" role="dialog" aria-modal="true" aria-labelledby={titleId} data-trainer-profile>
      <button type="button" className="trainer-scrim" aria-label="Cerrar perfil" tabIndex={-1} onClick={onClose} />
      <article className="trainer-plaque" data-plate={plate}>
        <p className="trainer-kicker">Entrenador de campo</p>
        <div className="trainer-seal" data-plate={plate} aria-hidden="true">
          <span>Nv</span>
          <strong>{progress ? progress.level : "—"}</strong>
        </div>
        <h2 id={titleId} className="trainer-rank">
          {rank ?? "Expedición"}
        </h2>
        <p className="trainer-place">Expedición Argentina</p>
        {progress ? (
          <>
            <p className="trainer-xp-line">
              XP de expedición <strong>{progress.xp}</strong>
              <span aria-hidden="true"> / </span>
              <span className="sr-only"> de </span>
              {progress.maxXp}
            </p>
            <div
              className="trainer-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
              aria-valuetext={nextLine}
            >
              <span style={{ width: `${progress.percent}%` }} />
            </div>
          </>
        ) : (
          <p className="trainer-xp-line">XP de expedición incompleta</p>
        )}
        <p className="trainer-next">{nextLine}</p>
        <p className="trainer-caught">
          Capturados <strong>{caught}</strong>
          <span aria-hidden="true"> / </span>
          <span className="sr-only"> de </span>
          {EXPEDITION_SIZE}
        </p>
        <ul className="trainer-tray" aria-label="Acabados de carta">
          {CARD_FINISHES.map((finish) => {
            const unlocked = progress ? progress.level >= finish.unlockLevel : finish.id === "base";
            const selected = inspected === finish.id;
            return (
              <li key={finish.id}>
                <button
                  type="button"
                  className="trainer-sample"
                  data-finish={finish.id}
                  data-state={unlocked ? "open" : "locked"}
                  aria-pressed={selected}
                  aria-label={
                    unlocked
                      ? `${finish.label}, desbloqueado, nivel ${finish.unlockLevel}`
                      : `${finish.label}, bloqueado, requiere nivel ${finish.unlockLevel}`
                  }
                  onClick={() => onInspect(finish.id)}
                >
                  <span className="trainer-sample-metal" data-finish={finish.id} />
                  <span className="trainer-sample-name">{finish.label}</span>
                  <span className="trainer-sample-level">{unlocked ? "Listo" : `Nv ${finish.unlockLevel}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {detail ? (
          <p className="trainer-detail" data-finish={detail.id}>
            <strong>{detail.label}.</strong> {detail.note}{" "}
            {progress && progress.level >= detail.unlockLevel
              ? "Disponible para las especies capturadas."
              : `Pendiente hasta el nivel ${detail.unlockLevel}.`}{" "}
            No cambia tipo, poder ni estadísticas.
          </p>
        ) : null}
        <button ref={closeRef} type="button" className="trainer-close" onClick={onClose}>
          Cerrar
        </button>
      </article>
    </div>
  );
}
