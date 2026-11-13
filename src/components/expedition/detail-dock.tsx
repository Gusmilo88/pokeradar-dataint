"use client";

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

function Step({
  current,
  children,
}: {
  current: boolean;
  children: string;
}) {
  return (
    <li
      aria-current={current ? "step" : undefined}
      className={current ? "text-amber" : "text-quiet"}
    >
      {children}
    </li>
  );
}

export function DetailDock({
  sightings,
  selectedId,
  zone,
  phase,
  entry,
  message,
  speciesName,
  knownNames,
  notebookOpen,
  catalogStatus,
  catalogMessage,
  onSelect,
  onRetry,
  onRetryCatalog,
  onToggleNotebook,
}: {
  sightings: readonly Sighting[];
  selectedId: string | null;
  zone: ExpeditionZone | null;
  phase: DossierPhase;
  entry: DossierEntry | null;
  message: string | null;
  speciesName: string | null;
  knownNames: ReadonlyMap<string, string>;
  notebookOpen: boolean;
  catalogStatus: "loading" | "ready" | "error";
  catalogMessage: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onRetryCatalog: () => void;
  onToggleNotebook: () => void;
}) {
  const currentStep =
    phase === "ready" ? "registrar" : phase === "idle" ? "explorar" : "descubrir";
  const pendingLabel = speciesName ? speciesLabel(speciesName) : "la especie";

  return (
    <aside
      aria-labelledby="bitacora-titulo"
      className="relative flex h-full min-h-0 flex-col bg-abyss lg:border-l lg:border-phosphor/20"
    >
      <div className="pointer-events-none absolute top-0 bottom-0 left-4 w-px bg-amber/35" aria-hidden="true" />
      <div className="border-b border-phosphor/15 px-5 py-3 pl-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
              Cuaderno de campo
            </p>
            <h2 id="bitacora-titulo" className="text-lg font-semibold tracking-tight">
              Bitácora
            </h2>
          </div>
          <button
            type="button"
            className="action-button lg:hidden"
            onClick={onToggleNotebook}
          >
            {notebookOpen ? "Mapa" : "Bitácora"}
          </button>
        </div>
        <ol className="mt-2 flex gap-3 font-mono text-[10px] tracking-[0.16em] uppercase">
          <Step current={currentStep === "explorar"}>Explorar</Step>
          <Step current={currentStep === "descubrir"}>Descubrir</Step>
          <Step current={currentStep === "registrar"}>Registrar</Step>
        </ol>
      </div>
      <div className={notebookOpen ? "flex min-h-0 flex-1 flex-col" : "hidden min-h-0 flex-1 flex-col lg:flex"}>
        <div className="scroll-thin max-h-[48%] min-h-0 overflow-y-auto" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {catalogStatus === "error" ? (
              <motion.div key="catalog-error" {...panelMotion} className="px-5 py-4 pl-8">
                <p className="font-mono text-[10px] tracking-[0.18em] text-danger uppercase">
                  Error
                </p>
                <h3 className="mt-1 text-lg font-semibold">Los hábitats no respondieron</h3>
                <p className="mt-2 text-sm leading-6 text-quiet">
                  {catalogMessage ?? "PokéAPI no entregó las especies. No se inventaron encuentros."}
                </p>
                <button type="button" className="action-button mt-3" onClick={onRetryCatalog}>
                  Reintentar
                </button>
              </motion.div>
            ) : phase === "idle" ? (
              <motion.div key="idle" {...panelMotion} className="px-5 py-4 pl-8">
                <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
                  Explorar
                </p>
                <h3 className="mt-1 text-lg font-semibold">Ningún encuentro abierto</h3>
                <p className="mt-2 text-sm leading-6 text-quiet">
                  {catalogStatus === "loading"
                    ? "Estamos leyendo los hábitats reales de PokéAPI. Las posiciones salen de una semilla fija, no de cada render."
                    : "Elegí un sello en el mapa o una línea del índice. La ficha se pide recién ahí, y el registro queda en este cuaderno."}
                </p>
              </motion.div>
            ) : phase === "loading" ? (
              <motion.div key={`loading-${speciesName ?? "none"}`} {...panelMotion} className="px-5 py-4 pl-8" aria-busy="true">
                <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
                  Descubrir
                </p>
                <h3 className="mt-1 text-lg font-semibold">Abriendo la ficha de {pendingLabel}</h3>
                <div className="mt-4 space-y-2" aria-hidden="true">
                  <div className="h-3 w-2/3 bg-phosphor/15" />
                  <div className="h-3 w-1/2 bg-phosphor/10" />
                  <div className="h-px w-full bg-phosphor/15" />
                  <div className="h-px w-4/5 bg-phosphor/15" />
                </div>
              </motion.div>
            ) : phase === "error" ? (
              <motion.div key={`error-${speciesName ?? "none"}`} {...panelMotion} className="px-5 py-4 pl-8" role="alert">
                <p className="font-mono text-[10px] tracking-[0.18em] text-danger uppercase">
                  Error
                </p>
                <h3 className="mt-1 text-lg font-semibold">La ficha no llegó</h3>
                <p className="mt-2 text-sm leading-6 text-quiet">
                  {message ?? "PokéAPI falló. No se completó la ficha con datos estimados."}
                </p>
                <button type="button" className="action-button mt-3" onClick={onRetry}>
                  Reintentar
                </button>
              </motion.div>
            ) : entry && zone ? (
              <motion.div key={selectedId ?? entry.speciesName} {...panelMotion}>
                <FieldEntry entry={entry} zone={zone} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {catalogStatus === "ready" ? (
          <EncounterIndex
            sightings={sightings}
            selectedId={selectedId}
            knownNames={knownNames}
            onSelect={onSelect}
          />
        ) : null}
      </div>
    </aside>
  );
}
