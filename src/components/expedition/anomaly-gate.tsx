"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Aviso del PokéRadar antes de entrar a un enclave.
 * No nombra a la criatura mientras sigue sin descubrir.
 */
export function AnomalyGate({
  knownName,
  onInvestigate,
  onClose,
}: {
  knownName: string | null;
  onInvestigate: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

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
      >
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#8ef6df] uppercase">PokéRadar</p>
        <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-tight text-[#f4fffd]">
          Señal extraordinaria
        </h2>
        <div id={bodyId} className="mt-3 space-y-3 text-sm leading-6 text-[#d5eef2]">
          {knownName ? (
            <p>
              {knownName} ya figura en la bitácora. El santuario sigue en el hielo.
            </p>
          ) : (
            <p>
              El PokéRadar detectó una presencia de energía inusualmente elevada en esta región. Su
              identidad es desconocida y podría tratarse de un Pokémon extremadamente poderoso.
            </p>
          )}
          <p className="text-[#f4fffd]">¿Querés investigar la anomalía?</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="action-button inline-flex min-h-11 items-center justify-center"
            onClick={onInvestigate}
            autoFocus
          >
            Investigar
          </button>
          <button
            type="button"
            className="action-button inline-flex min-h-11 items-center justify-center"
            onClick={onClose}
          >
            Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}
