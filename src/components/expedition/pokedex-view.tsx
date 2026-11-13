"use client";

import { useEffect, useId, useState } from "react";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import { FieldEntry } from "@/components/expedition/field-entry";
import { useDossier } from "@/components/expedition/use-dossier";
import { findEnclaveByEncounter } from "@/lib/expedition/enclaves";
import { findZone } from "@/lib/expedition/pins";
import { explorationHint } from "@/lib/expedition/hints";
import { KANTO_CATALOG, type CatalogEntry } from "@/lib/expedition/kanto";
import { discoveryState, tally, type Progress } from "@/lib/expedition/progress";
import { speciesLabel } from "@/lib/pokeapi/labels";

const ORDERED = [...KANTO_CATALOG].sort(
  (left, right) => left.expeditionNumber - right.expeditionNumber,
);

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function PokedexView({
  progress,
  onClose,
  onSeek,
  onReset,
}: {
  progress: Progress;
  onClose: () => void;
  onSeek: (encounterId: string) => void;
  onReset: () => void;
}) {
  const titleId = useId();
  const [focusNumber, setFocusNumber] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const focused = ORDERED.find((entry) => entry.expeditionNumber === focusNumber) ?? null;
  const counts = tally(progress);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="absolute inset-0 z-40 flex min-h-0 flex-col bg-abyss"
    >
      <div className="flex items-start justify-between gap-3 border-b border-phosphor/20 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
            Álbum de campo
          </p>
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            Pokédex
          </h2>
          <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-quiet uppercase">
            {counts.seen} vistas · {counts.caught} capturadas
          </p>
        </div>
        <button
          type="button"
          className="action-button inline-flex items-center justify-center"
          onClick={onClose}
          autoFocus
        >
          Mapa
        </button>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className={focused ? "hidden min-h-0 overflow-y-auto lg:block" : "min-h-0 overflow-y-auto"}>
          <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-4">
            {ORDERED.map((entry) => {
              const state = discoveryState(progress, entry.encounterId);
              const revealed = state !== "undiscovered";
              const zone = entry.zoneId ? (findZone(entry.zoneId) ?? null) : null;
              const name = revealed ? speciesLabel(entry.speciesName) : "???";
              return (
                <li key={entry.encounterId}>
                  <button
                    type="button"
                    className={
                      focusNumber === entry.expeditionNumber
                        ? "flex min-h-36 w-full flex-col items-center border border-amber bg-void/70 px-3 py-3 text-center"
                        : "flex min-h-36 w-full flex-col items-center border border-phosphor/20 bg-void/40 px-3 py-3 text-center hover:border-phosphor/50"
                    }
                    aria-pressed={focusNumber === entry.expeditionNumber}
                    aria-label={
                      revealed
                        ? `${name}. Expedición ${pad(entry.expeditionNumber)}. ${state === "caught" ? "Capturado" : "Visto"}.`
                        : `Expedición ${pad(entry.expeditionNumber)}. Identidad desconocida.`
                    }
                    onClick={() => setFocusNumber(entry.expeditionNumber)}
                  >
                    <span className="font-mono text-[10px] tracking-[0.16em] text-quiet">
                      {pad(entry.expeditionNumber)}
                    </span>
                    <span className="my-2 grid h-16 w-16 place-items-center">
                      <CreatureSprite
                        nationalId={entry.nationalId}
                        revealed={revealed}
                        label={revealed ? name : null}
                      />
                    </span>
                    <span className="text-sm font-semibold text-ink">{name}</span>
                    <span className="mt-1 font-mono text-[10px] tracking-[0.12em] text-quiet uppercase">
                      {state === "caught" ? "Capturado" : revealed ? "Visto" : "Bloqueada"}
                    </span>
                    {revealed ? null : (
                      <span className="mt-2 line-clamp-3 text-xs leading-4 text-quiet">
                        {explorationHint(entry, zone)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-phosphor/15 px-4 py-4">
            {confirmReset ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-quiet">Se borran las vistas de esta expedición.</p>
                <button
                  type="button"
                  className="action-button inline-flex items-center justify-center"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                    setFocusNumber(null);
                  }}
                >
                  Confirmar reinicio
                </button>
                <button
                  type="button"
                  className="action-button inline-flex items-center justify-center opacity-70"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="action-button inline-flex items-center justify-center opacity-80"
                onClick={() => setConfirmReset(true)}
              >
                Reiniciar expedición
              </button>
            )}
          </div>
        </div>
        <div
          className={
            focused
              ? "min-h-0 overflow-y-auto border-phosphor/20 lg:border-l"
              : "hidden min-h-0 overflow-y-auto border-phosphor/20 lg:block lg:border-l"
          }
        >
          {focused ? (
            <DexPlate
              entry={focused}
              state={discoveryState(progress, focused.encounterId)}
              onBack={() => setFocusNumber(null)}
              onSeek={onSeek}
            />
          ) : (
            <p className="px-5 py-6 text-sm text-quiet">Elegí una entrada del álbum.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DexPlate({
  entry,
  state,
  onBack,
  onSeek,
}: {
  entry: CatalogEntry;
  state: "undiscovered" | "seen" | "caught";
  onBack: () => void;
  onSeek: (encounterId: string) => void;
}) {
  const revealed = state !== "undiscovered";
  const zone = entry.zoneId ? (findZone(entry.zoneId) ?? null) : null;
  const enclave = findEnclaveByEncounter(entry.encounterId);
  const dossier = useDossier(revealed ? entry.speciesName : null);
  const name = revealed ? (dossier.entry?.species.spanishName ?? speciesLabel(entry.speciesName)) : "???";

  return (
    <div className="px-4 py-4">
      <button
        type="button"
        className="action-button mb-4 inline-flex items-center justify-center lg:hidden"
        onClick={onBack}
      >
        Álbum
      </button>
      {revealed && dossier.entry ? (
        <FieldEntry
          entry={dossier.entry}
          zone={zone}
          expeditionNumber={entry.expeditionNumber}
          state={state === "caught" ? "caught" : "seen"}
          place={enclave ? `${enclave.place}. ${enclave.region}.` : undefined}
        />
      ) : (
        <article className="border border-phosphor/20 bg-void/40 px-4 py-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-amber uppercase">
            Exp. {pad(entry.expeditionNumber)}
            {revealed ? ` · #${String(entry.nationalId).padStart(4, "0")}` : ""}
          </p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight">{name}</h3>
          <div className="mx-auto my-4 grid h-28 w-28 place-items-center">
            <CreatureSprite
              nationalId={entry.nationalId}
              revealed={revealed}
              label={revealed ? name : null}
              stillUrl={dossier.entry?.pokemon.sprites.blackWhite}
              animatedUrl={dossier.entry?.pokemon.sprites.blackWhiteAnimated}
            />
          </div>
          <p className="font-mono text-[10px] tracking-[0.14em] text-quiet uppercase">
            {state === "caught" ? "Capturado" : revealed ? "Visto" : "Bloqueada"}
          </p>
          {revealed ? (
            <p className="mt-3 text-sm text-quiet" aria-busy={dossier.phase === "loading"}>
              {dossier.phase === "error"
                ? (dossier.message ?? "La ficha no llegó. Sigue registrada como vista.")
                : "Consultando tipos y estadísticas."}
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-quiet">{explorationHint(entry, zone)}</p>
              <p className="mt-2 text-sm text-quiet">Nombre, tipos y estadísticas bloqueados.</p>
            </>
          )}
          {dossier.phase === "error" ? (
            <button
              type="button"
              className="action-button mt-3 inline-flex items-center justify-center"
              onClick={dossier.retry}
            >
              Reintentar
            </button>
          ) : null}
          {entry.role === "field" ? (
            <button
              type="button"
              className="action-button mt-4 inline-flex items-center justify-center"
              onClick={() => onSeek(entry.encounterId)}
            >
              {revealed ? "Ver en el mapa" : "Buscar en el mapa"}
            </button>
          ) : (
            <p className="mt-4 text-sm text-quiet">Sin enclave de campo.</p>
          )}
        </article>
      )}
      {enclave && revealed ? (
        <button
          type="button"
          className="action-button mt-4 inline-flex items-center justify-center"
          onClick={() => onSeek(entry.encounterId)}
        >
          Ver en el mapa
        </button>
      ) : null}
    </div>
  );
}
