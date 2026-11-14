"use client";

import { EncounterIndex } from "@/components/expedition/encounter-index";
import type { Sighting } from "@/lib/expedition/argentina";

export function DetailDock({
  sightings,
  selectedId,
  knownNames,
  revealedIds,
  onSelect,
  onClose,
}: {
  sightings: readonly Sighting[];
  selectedId: string | null;
  knownNames: ReadonlyMap<string, string>;
  revealedIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <aside aria-labelledby="bitacora-titulo" className="relative flex h-full min-h-0 flex-col bg-abyss">
      <div className="pointer-events-none absolute top-0 bottom-0 left-4 w-px bg-amber/35" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 border-b border-phosphor/15 px-4 py-3 pl-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">Cuaderno</p>
          <h2 id="bitacora-titulo" className="text-lg font-semibold tracking-tight">Bitácora</h2>
        </div>
        <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <EncounterIndex
        sightings={sightings}
        selectedId={selectedId}
        knownNames={knownNames}
        revealedIds={revealedIds}
        onSelect={onSelect}
      />
    </aside>
  );
}
