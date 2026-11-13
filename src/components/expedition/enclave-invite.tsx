"use client";

import type { Enclave } from "@/lib/expedition/enclaves";

export function EnclaveInvite({
  enclave,
  revealedName,
  onEnter,
  onIndex,
  onClose,
}: {
  enclave: Enclave;
  revealedName: string | null;
  onEnter: () => void;
  onIndex: () => void;
  onClose: () => void;
}) {
  return (
    <aside
      aria-labelledby="anomalia-titulo"
      className="relative flex h-full min-h-0 flex-col bg-abyss lg:border-l lg:border-phosphor/20"
    >
      <div className="pointer-events-none absolute top-0 bottom-0 left-4 w-px bg-amber/35" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 border-b border-phosphor/15 px-4 py-3 pl-8">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
            Anomalía
          </p>
          <h2 id="anomalia-titulo" className="text-lg font-semibold tracking-tight">
            {enclave.place}
          </h2>
          <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-quiet uppercase">
            {enclave.region}
          </p>
        </div>
        <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4 pl-8">
        <p className="text-sm leading-6 text-quiet">
          {revealedName
            ? `${revealedName} ya está en la bitácora. ${enclave.remains}`
            : enclave.anomaly}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="action-button inline-flex items-center justify-center"
            onClick={onEnter}
            autoFocus
          >
            Investigar
          </button>
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={onIndex}>
            Índice
          </button>
        </div>
      </div>
    </aside>
  );
}
