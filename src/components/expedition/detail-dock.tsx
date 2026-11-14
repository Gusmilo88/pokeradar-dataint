"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EncounterIndex } from "@/components/expedition/encounter-index";
import { FieldEntry } from "@/components/expedition/field-entry";
import type { DossierEntry, DossierPhase } from "@/components/expedition/use-dossier";
import type { ExpeditionZone, Sighting } from "@/lib/expedition/argentina";
import { speciesLabel } from "@/lib/pokeapi/labels";

const panelMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export function DetailDock({
  sightings,
  selectedId,
  zone,
  phase,
  entry,
  message,
  speciesName,
  knownNames,
  expeditionNumber,
  revealedIds,
  status,
  onSelect,
  onRetry,
  onClose,
  onCaptured,
}: {
  sightings: readonly Sighting[];
  selectedId: string | null;
  zone: ExpeditionZone | null;
  phase: DossierPhase;
  entry: DossierEntry | null;
  message: string | null;
  speciesName: string | null;
  knownNames: ReadonlyMap<string, string>;
  expeditionNumber: number | null;
  revealedIds: ReadonlySet<string>;
  status: "seen" | "caught";
  onSelect: (id: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onCaptured: (encounterId: string) => void;
}) {
  const [pinnedView, setPinnedView] = useState<{
    id: string | null;
    view: "entry" | "index";
  }>({ id: null, view: "index" });
  const view =
    pinnedView.id === selectedId ? pinnedView.view : selectedId ? "entry" : "index";
  const moment = phase === "ready" ? "Registrar" : phase === "idle" ? "Explorar" : "Descubrir";
  const revealed = selectedId ? revealedIds.has(selectedId) : false;
  const pendingLabel =
    revealed && speciesName
      ? (knownNames.get(speciesName) ?? speciesLabel(speciesName))
      : "una señal";

  function showIndex() {
    setPinnedView({ id: selectedId, view: "index" });
  }

  function showEntry() {
    setPinnedView({ id: selectedId, view: "entry" });
  }

  return (
    <aside
      aria-labelledby="bitacora-titulo"
      className="relative flex h-full min-h-0 flex-col bg-abyss lg:border-l lg:border-phosphor/20"
    >
      <div className="pointer-events-none absolute top-0 bottom-0 left-4 w-px bg-amber/35" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 border-b border-phosphor/15 px-4 py-3 pl-8">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
            Cuaderno
          </p>
          <h2 id="bitacora-titulo" className="text-lg font-semibold tracking-tight">
            Bitácora
          </h2>
          <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-quiet uppercase">
            Momento: <span className="text-amber">{moment}</span>
          </p>
        </div>
        <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose}>
          Cerrar
        </button>
      </div>
      {phase !== "idle" ? (
        <div className="flex gap-2 border-b border-phosphor/15 px-4 py-2 pl-8">
          <button
            type="button"
            className={view === "entry" ? "action-button inline-flex items-center justify-center" : "action-button inline-flex items-center justify-center opacity-60"}
            aria-pressed={view === "entry"}
            onClick={showEntry}
          >
            Ficha
          </button>
          <button
            type="button"
            className={view === "index" ? "action-button inline-flex items-center justify-center" : "action-button inline-flex items-center justify-center opacity-60"}
            aria-pressed={view === "index"}
            onClick={showIndex}
          >
            Índice
          </button>
        </div>
      ) : null}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        {view === "index" ? (
          <EncounterIndex
            sightings={sightings}
            selectedId={selectedId}
            knownNames={knownNames}
            revealedIds={revealedIds}
            onSelect={onSelect}
          />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {phase === "idle" ? (
              <motion.div key="idle" {...panelMotion} className="px-5 py-4 pl-8">
                <h3 className="text-lg font-semibold">Ningún encuentro abierto</h3>
                <p className="mt-2 text-sm text-quiet">
                  Elegí una región en el mapa o una especie del índice. Los colores sobre el terreno son acentos de la expedición, no biomas ni provincias.
                </p>
              </motion.div>
            ) : phase === "loading" ? (
              <motion.div
                key={`loading-${speciesName ?? "none"}`}
                {...panelMotion}
                className="px-5 py-4 pl-8"
                aria-busy="true"
              >
                <h3 className="text-lg font-semibold">
                  {revealed ? `Abriendo ${pendingLabel}` : "Señal nueva"}
                </h3>
                {revealed ? null : (
                  <p className="mt-2 text-sm text-quiet">
                    El registro todavía no tiene nombre. Consultando PokéAPI.
                  </p>
                )}
                <div className="mt-4 space-y-2" aria-hidden="true">
                  <div className="h-3 w-2/3 bg-phosphor/15" />
                  <div className="h-3 w-1/2 bg-phosphor/10" />
                </div>
              </motion.div>
            ) : phase === "error" ? (
              <motion.div
                key={`error-${speciesName ?? "none"}`}
                {...panelMotion}
                className="px-5 py-4 pl-8"
                role="alert"
              >
                <h3 className="text-lg font-semibold">La ficha no llegó</h3>
                <p className="mt-2 text-sm text-quiet">
                  {revealed
                    ? (message ?? "PokéAPI falló. No se inventaron datos.")
                    : "PokéAPI no respondió. La señal sigue sin identificar."}
                </p>
                <button type="button" className="action-button mt-3 inline-flex items-center justify-center" onClick={onRetry}>
                  Reintentar
                </button>
              </motion.div>
            ) : entry && zone ? (
              <motion.div key={selectedId ?? entry.speciesName} {...panelMotion}>
                <FieldEntry
                  entry={entry}
                  zone={zone}
                  expeditionNumber={expeditionNumber}
                  state={status}
                  encounterId={selectedId ?? undefined}
                  onCaptured={onCaptured}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        )}
      </div>
    </aside>
  );
}
