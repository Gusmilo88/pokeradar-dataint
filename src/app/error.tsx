"use client";

import { useEffect } from "react";
import { StatusPanel } from "@/components/states/status-panel";
import { errorMessage } from "@/lib/errors/message";

export default function ExpeditionError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <StatusPanel
        tone="error"
        title="La expedición se detuvo"
        description={errorMessage(
          error,
          "Ocurrió un error inesperado al armar la pantalla.",
        )}
        action={
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={() => retry()}>
            Reintentar
          </button>
        }
      />
    </div>
  );
}
