"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import { prefersReducedMotion } from "@/lib/a11y/motion";
import { playLevelFanfare } from "@/lib/expedition/capture-audio";
import { KANTO_CATALOG, type CatalogEntry } from "@/lib/expedition/kanto";
import type { LevelCeremonyPlan } from "@/lib/expedition/level-ceremony";
import type { CardFinish } from "@/lib/expedition/trainer-rewards";
import { speciesLabel } from "@/lib/pokeapi/labels";
import "./album.css";
import "./level-ceremony.css";

function captureBusy(): boolean {
  return document.querySelector(".capture-stage") !== null;
}

export function LevelCeremony({
  item,
  pending,
  onClose,
  onSkip,
}: {
  item: LevelCeremonyPlan;
  pending: number;
  onClose: () => void;
  onSkip: () => void;
}) {
  return <LevelStage key={item.id} item={item} pending={pending} onClose={onClose} onSkip={onSkip} />;
}

function LevelStage({
  item,
  pending,
  onClose,
  onSkip,
}: {
  item: LevelCeremonyPlan;
  pending: number;
  onClose: () => void;
  onSkip: () => void;
}) {
  const titleId = useId();
  const phraseId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const fanfarePlayed = useRef(false);
  const reduced = prefersReducedMotion();
  const [clear, setClear] = useState(false);
  const [shown, setShown] = useState(reduced ? item.toLevel : item.fromLevel);
  const specimen = KANTO_CATALOG.find((entry) => entry.encounterId === item.specimenId) ?? null;
  const rewardNames = item.rewards.map((finish) => finish.label).join(", ");
  const summary = [
    `Nivel ${item.toLevel}.`,
    `Rango ${item.rank}.`,
    item.phrase,
    rewardNames ? `${rewardNames}. Disponible para equipar en tu perfil.` : "",
  ].filter((part) => part.length > 0).join(" ");

  useEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const node = opener.current;
      window.setTimeout(() => {
        if (document.querySelector("[data-level-ceremony], [data-badge-ceremony]")) {
          return;
        }
        node?.focus();
      }, 0);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (captureBusy()) {
        setClear(false);
        frame = window.requestAnimationFrame(tick);
        return;
      }
      setClear(true);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [item]);

  useEffect(() => {
    if (!clear || fanfarePlayed.current) {
      return;
    }
    fanfarePlayed.current = true;
    playLevelFanfare(item.rewards.length > 0 ? "reward" : "level");
  }, [clear, item]);

  useEffect(() => {
    if (!clear || reduced) {
      return;
    }
    const timer = window.setTimeout(() => setShown(item.toLevel), 420);
    return () => window.clearTimeout(timer);
  }, [clear, item.toLevel, reduced]);

  useEffect(() => {
    if (!clear) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [clear]);

  useEffect(() => {
    if (!clear) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (captureBusy()) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const root = dialogRef.current;
      if (!root) {
        return;
      }
      const items = [...root.querySelectorAll<HTMLElement>("button:not([disabled])")];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      const inside = active instanceof Node && root.contains(active);
      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [clear, onClose]);

  if (!clear || typeof document === "undefined") {
    return null;
  }

  const displayed = reduced ? item.toLevel : shown;
  const sparks = reduced ? 0 : item.intensity === "diamond" ? 16 : item.intensity === "gold" ? 12 : 7;

  return createPortal(
    <div
      className="level-ceremony"
      data-level-ceremony=""
      data-motion={reduced ? "reduce" : "full"}
      data-intensity={item.intensity}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={phraseId}
        tabIndex={-1}
        className="level-ceremony-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only">{summary}</h2>
        <div className="level-crest">
          {sparks > 0 ? (
            <ul className="level-sparks" aria-hidden="true">
              {Array.from({ length: sparks }, (_, index) => (
                <li key={index} />
              ))}
            </ul>
          ) : null}
          <p className="level-kicker">Entrenador</p>
          <p className="level-now" aria-hidden="true" data-live={displayed === item.toLevel ? "true" : "false"}>{displayed}</p>
          <p className="level-rank">{item.rank}</p>
          <p id={phraseId} className="level-phrase">{item.phrase}</p>
        </div>
        {item.rewards.length > 0 ? (
          <div className="level-loot">
            <p className="level-kicker">
              {item.rewards.length > 1 ? "Acabados desbloqueados" : "Acabado desbloqueado"}
            </p>
            <div className="level-rewards">
              {item.rewards.map((finish) => (
                <RewardPreview
                  key={finish.id}
                  finish={finish}
                  specimen={specimen}
                  featured={finish.id === item.rewards[item.rewards.length - 1]?.id}
                />
              ))}
            </div>
            <p className="level-equip">Disponible para equipar en tu perfil.</p>
          </div>
        ) : null}
        <div className="level-actions">
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose}>
            Cerrar
          </button>
          {pending > 1 ? (
            <button type="button" className="action-button inline-flex items-center justify-center" onClick={onSkip}>
              Omitir
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RewardPreview({
  finish,
  specimen,
  featured,
}: {
  finish: CardFinish;
  specimen: CatalogEntry | null;
  featured: boolean;
}) {
  const name = specimen ? speciesLabel(specimen.speciesName) : "Expedición";
  return (
    <figure className="level-reward" data-feature={featured ? "true" : "false"} data-finish={finish.id}>
      <article className="tcg-card finish-mini" data-finish={finish.id} data-face="front">
        <div className="tcg-face tcg-front">
          <span className="card-skin" aria-hidden="true"><span className="card-sheen" /></span>
          <div className="tcg-frame">
            <header className="tcg-top">
              <div className="min-w-0">
                <p className="tcg-kicker">
                  {specimen ? `#${String(specimen.nationalId).padStart(4, "0")}` : "Campo"}
                </p>
                <p className="tcg-name">{name}</p>
              </div>
              <p className="tcg-hp">
                <span>PS</span>
                <strong>—</strong>
              </p>
            </header>
            <div className="tcg-art">
              {specimen ? (
                <CreatureSprite nationalId={specimen.nationalId} revealed label={name} />
              ) : (
                <p className="tcg-kicker">Sin captura</p>
              )}
            </div>
            <p className="tcg-imprint">{finish.label}</p>
          </div>
        </div>
      </article>
      <figcaption>{finish.label}</figcaption>
    </figure>
  );
}
