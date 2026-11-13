"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Aviso del PokéRadar antes de entrar a un enclave.
 * No nombra a la criatura mientras sigue sin descubrir.
 */
export function AnomalyGate({
  knownName,
  remains,
  onInvestigate,
  onClose,
}: {
  knownName: string | null;
  remains: string;
  onInvestigate: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    function onHide() {
      setPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const buttons = [...dialogRef.current.querySelectorAll<HTMLButtonElement>("button")];
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="gate-shade">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="gate-card"
        data-paused={paused ? "true" : "false"}
      >
        <span className="gate-corner gate-corner-nw" aria-hidden="true" />
        <span className="gate-corner gate-corner-ne" aria-hidden="true" />
        <span className="gate-corner gate-corner-sw" aria-hidden="true" />
        <span className="gate-corner gate-corner-se" aria-hidden="true" />
        <p id={titleId} className="gate-kicker">
          PokéRadar · Señal anómala
        </p>
        <div className="gate-radar" aria-hidden="true">
          <span className="gate-radar-ring" />
          <span className="gate-radar-sweep" />
          <span className="gate-radar-mark" />
        </div>
        <p className="gate-meter">{knownName ? "Señal registrada" : "Energía extraordinaria"}</p>
        <div id={bodyId} className="gate-copy">
          {knownName ? (
            <p>{knownName} ya figura en la bitácora. {remains}</p>
          ) : (
            <p>
              Detectamos una presencia de energía extraordinaria en esta región. Su identidad es
              desconocida. Podría tratarse de un Pokémon extremadamente poderoso.
            </p>
          )}
          <p className="gate-ask">¿Querés investigar la señal?</p>
        </div>
        <div className="gate-actions">
          <button type="button" className="gate-btn gate-btn-go" onClick={onInvestigate} autoFocus>
            Investigar
          </button>
          <button type="button" className="gate-btn" onClick={onClose}>
            Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}
