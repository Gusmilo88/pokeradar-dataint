"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import { FinishChooser } from "@/components/expedition/finish-chooser";
import { EXPEDITION_SIZE, type CatalogEntry } from "@/lib/expedition/kanto";
import {
  cardFinish,
  nextFinishReward,
  plateForLevel,
  rankForLevel,
  type CardFinishId,
} from "@/lib/expedition/trainer-rewards";
import type { TrainerLevelProgress } from "@/lib/expedition/trainer-xp";
import { speciesLabel } from "@/lib/pokeapi/labels";
import "./trainer-profile.css";

export function TrainerProfile({
  progress,
  seen,
  caught,
  badgesEarned,
  badgesTotal,
  sample,
  equipped,
  onEquip,
  onClose,
}: {
  progress: TrainerLevelProgress | null;
  seen: number;
  caught: number;
  badgesEarned: number;
  badgesTotal: number;
  sample: CatalogEntry | null;
  equipped: CardFinishId;
  onEquip: (id: CardFinishId) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<CardFinishId | null>(null);
  const [pickedFor, setPickedFor] = useState(equipped);
  if (pickedFor !== equipped) {
    setPickedFor(equipped);
    setPicked(null);
  }
  const preview = picked ?? equipped;
  const level = progress?.level ?? 1;
  const rank = progress ? rankForLevel(progress.level) : null;
  const plate = progress ? plateForLevel(progress.level) : "base";
  const equippedLabel = cardFinish(equipped)?.label ?? "Base";
  const reward = progress ? nextFinishReward(progress.level) : null;
  const digits = progress ? String(progress.level).length : 1;

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
        <div className="trainer-identity">
          <p className="trainer-kicker">Entrenador de campo</p>
          <div className="trainer-seal" data-plate={plate} data-digits={digits} aria-hidden="true">
            <strong>{progress ? progress.level : "—"}</strong>
            <span>NV</span>
          </div>
          <h2 id={titleId} className="trainer-rank">
            {rank ?? "Expedición"}
          </h2>
          <p className="trainer-place">Nivel {progress ? progress.level : "—"} · {rank ?? "Expedición"}</p>
          {progress ? (
            <>
              <p className="trainer-xp-line">
                XP acumulada <strong>{progress.xp}</strong>
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
          <dl className="trainer-ledger">
            <div>
              <dt>Vistas</dt>
              <dd>{seen}</dd>
            </div>
            <div>
              <dt>Capturadas</dt>
              <dd>
                {caught}
                <span> / {EXPEDITION_SIZE}</span>
              </dd>
            </div>
            <div>
              <dt>Medallas</dt>
              <dd>
                {badgesEarned}
                <span> / {badgesTotal}</span>
              </dd>
            </div>
            <div>
              <dt>Acabado</dt>
              <dd>{equippedLabel}</dd>
            </div>
          </dl>
          <p className="trainer-next">
            {reward
              ? `Próxima recompensa: ${reward.label}. Nivel ${reward.unlockLevel}.`
              : "No queda un acabado posterior."}
          </p>
        </div>
        <div className="trainer-showcase">
          <FinishSpecimen finish={preview} sample={sample} />
          <FinishChooser
            level={level}
            equipped={equipped}
            preview={preview}
            onPreview={setPicked}
            onEquip={onEquip}
          />
        </div>
        <button ref={closeRef} type="button" className="trainer-close" onClick={onClose}>
          Cerrar
        </button>
      </article>
    </div>
  );
}

function FinishSpecimen({
  finish,
  sample,
}: {
  finish: CardFinishId;
  sample: CatalogEntry | null;
}) {
  const label = cardFinish(finish)?.label ?? "Base";
  const name = sample ? speciesLabel(sample.speciesName) : "Expedición";
  return (
    <div className="finish-specimen">
      <article className="tcg-card finish-mini" data-finish={finish} data-face="front">
        <div className="tcg-face tcg-front">
          <span className="card-skin" aria-hidden="true"><span className="card-sheen" /></span>
          <div className="tcg-frame">
            <header className="tcg-top">
              <div className="min-w-0">
                <p className="tcg-kicker">{sample ? `#${String(sample.nationalId).padStart(4, "0")}` : "Campo"}</p>
                <p className="tcg-name">{name}</p>
              </div>
              <p className="tcg-hp">
                <span>PS</span>
                <strong>—</strong>
              </p>
            </header>
            <div className="tcg-art">
              {sample ? (
                <CreatureSprite nationalId={sample.nationalId} revealed label={null} />
              ) : (
                <p className="tcg-kicker">Sin captura</p>
              )}
            </div>
            <p className="tcg-imprint">{label}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
