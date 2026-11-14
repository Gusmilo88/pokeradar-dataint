"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { prefersReducedMotion } from "@/lib/a11y/motion";
import type { BadgeView } from "@/lib/badges/evaluate";
import type { BadgeCeremony } from "@/components/expedition/use-badges";
import { playBadgeFanfare } from "@/lib/expedition/capture-audio";
import "./badges.css";

function captureBusy(): boolean {
  return document.querySelector(".capture-stage") !== null;
}

export function BadgeCeremony({
  item,
  badge,
  badges,
  pending,
  onClose,
  onSkip,
}: {
  item: BadgeCeremony;
  badge: BadgeView | null;
  badges: readonly BadgeView[];
  pending: number;
  onClose: () => void;
  onSkip: () => void;
}) {
  const titleId = useId();
  const [clear, setClear] = useState(false);
  const reduced = prefersReducedMotion();

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
    if (!clear) {
      return;
    }
    playBadgeFanfare(item.kind === "collection" ? "collection" : "medal");
  }, [clear, item]);

  useEffect(() => {
    if (!clear) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || captureBusy()) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [clear, onClose]);

  if (!clear || typeof document === "undefined") {
    return null;
  }

  const label = item.kind === "collection"
    ? "Completaste las ocho medallas de Kanto."
    : `¡Conseguiste la Medalla ${badge?.name ?? ""}!`;

  return createPortal(
    <div
      className="badge-ceremony"
      data-badge-ceremony=""
      data-kind={item.kind}
      data-motion={reduced ? "reduce" : "full"}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`badge-ceremony-card ${badge?.visualClass ?? "badge-tone-roca"}`}
        style={badge ? {
          "--badge-metal": badge.palette.metal,
          "--badge-gem": badge.palette.gem,
          "--badge-glow": badge.palette.glow,
          "--badge-wash": badge.palette.wash,
          "--badge-edge": badge.palette.edge,
        } as CSSProperties : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {item.kind === "collection" ? (
          <ul className="badge-ceremony-set">
            {badges.map((entry) => (
              <li key={entry.id}>
                {/* El WebP ya está en public. next/image lo volvería a procesar. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.assetPath} alt="" width={160} height={160} />
              </li>
            ))}
          </ul>
        ) : badge ? (
          <div className="badge-ceremony-medal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badge.assetPath} alt="" width={360} height={360} />
          </div>
        ) : null}
        <h2 id={titleId}>{label}</h2>
        <div className="badge-ceremony-actions">
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose} autoFocus>
            {pending > 1 ? "Seguir" : "Cerrar"}
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
