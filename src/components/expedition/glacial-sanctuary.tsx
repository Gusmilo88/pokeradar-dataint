"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import type { DossierEntry, DossierPhase } from "@/components/expedition/use-dossier";
import type { Enclave } from "@/lib/expedition/enclaves";
import { statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";

const MOTES = [
  { left: "22%", top: "58%", delay: "0s" },
  { left: "31%", top: "46%", delay: "1.4s" },
  { left: "63%", top: "52%", delay: "0.6s" },
  { left: "71%", top: "40%", delay: "2.1s" },
  { left: "48%", top: "34%", delay: "1.1s" },
] as const;

/**
 * Escena original. No reproduce un mapa de un juego.
 * El dibujo es SVG y CSS. El sprite, si aparece, sale de PokéAPI.
 */
export function GlacialSanctuary({
  enclave,
  phase,
  discovered,
  ceremony,
  entry,
  spriteId,
  label,
  onExamine,
  onRetry,
  onLeave,
}: {
  enclave: Enclave;
  phase: DossierPhase;
  discovered: boolean;
  ceremony: boolean;
  entry: DossierEntry | null;
  spriteId: number | null;
  label: string | null;
  onExamine: () => void;
  onRetry: () => void;
  onLeave: () => void;
}) {
  const titleId = useId();
  const leaveRef = useRef<HTMLButtonElement>(null);
  const loading = !discovered && phase === "loading";
  const failed = !discovered && phase === "error";
  const statsFailed = discovered && phase === "error";

  useEffect(() => {
    if (discovered && ceremony) {
      leaveRef.current?.focus();
    }
  }, [ceremony, discovered]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onLeave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onLeave]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="absolute inset-0 z-40 flex min-h-0 flex-col bg-[#07141c]"
    >
      <div className="relative min-h-[9rem] flex-1 overflow-hidden">
        <GlacialStage discovered={discovered} ceremony={ceremony} />
        <p className="sr-only">
          Santuario de hielo. Columnas, un altar en el centro y una luz fría desde arriba.
        </p>
        {discovered && spriteId && label ? (
          <div className="sanctuary-presence">
            <motion.div
              className="h-full w-full"
              initial={ceremony ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <CreatureSprite
                nationalId={spriteId}
                revealed
                label={label}
                stillUrl={entry?.pokemon.sprites.blackWhite}
                animatedUrl={entry?.pokemon.sprites.blackWhiteAnimated}
              />
            </motion.div>
          </div>
        ) : null}
      </div>
      <div className="sanctuary-log shrink-0">
        <div className="scroll-thin max-h-[32vh] overflow-y-auto px-4 pt-3 pb-2 sm:px-6">
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#8ef6df] uppercase">
            {enclave.region}
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-[#f4fffd]">
              {discovered && label ? label : enclave.place}
            </h2>
            {discovered ? <span className="sanctuary-chip">Visto</span> : null}
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-[#c5e7ea]" aria-busy="true">
              La señal responde. Consultando PokéAPI.
            </p>
          ) : null}
          {failed ? (
            <p className="mt-2 text-sm text-[#c5e7ea]" role="alert">
              PokéAPI no respondió. La señal sigue sin identificar.
            </p>
          ) : null}
          {statsFailed ? (
            <p className="mt-2 text-sm text-[#c5e7ea]" role="alert">
              La ficha no llegó. Sigue registrada como vista.
            </p>
          ) : null}
          {!loading && !failed && !discovered ? (
            <p className="mt-2 text-sm leading-6 text-[#c5e7ea]">{enclave.sealed}</p>
          ) : null}
          {discovered && entry ? (
            <>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {entry.pokemon.types.map((slot) => (
                  <span key={slot.type.name} className="sanctuary-type">
                    {typeLabel(slot.type.name)}
                  </span>
                ))}
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {entry.pokemon.stats.map((stat) => (
                  <li key={stat.stat.name}>
                    <span className="flex items-baseline justify-between gap-2 font-mono text-[10px] text-[#c5e7ea]">
                      <span>{statLabel(stat.stat.name)}</span>
                      <span className="text-sm text-[#f4fffd]">{stat.base_stat}</span>
                    </span>
                    <div className="sanctuary-stat mt-1">
                      <span style={{ width: `${Math.min(100, (stat.base_stat / STAT_SCALE) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {discovered && !entry ? (
            <p className="mt-2 text-sm text-[#c5e7ea]">La presencia ya está en la bitácora.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 px-4 py-3 sm:px-6">
          {failed || statsFailed ? (
            <button type="button" className="action-button inline-flex items-center justify-center" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
          {!discovered && !loading && !failed ? (
            <button
              type="button"
              className="action-button inline-flex items-center justify-center"
              onClick={onExamine}
              autoFocus
            >
              Examinar la señal
            </button>
          ) : null}
          <button
            ref={leaveRef}
            type="button"
            className="action-button inline-flex items-center justify-center"
            onClick={onLeave}
            autoFocus={discovered && !ceremony}
          >
            Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}

function GlacialStage({
  discovered,
  ceremony,
}: {
  discovered: boolean;
  ceremony: boolean;
}) {
  return (
    <div className="sanctuary-stage" data-ceremony={ceremony ? "true" : "false"} aria-hidden="true">
      <div className="sanctuary-sky" />
      <div className="sanctuary-wall" />
      <div className="sanctuary-beam" />
      <div className="sanctuary-col sanctuary-col-back-l" />
      <div className="sanctuary-col sanctuary-col-back-r" />
      <div className="sanctuary-well">
        <div className="sanctuary-floor">
          <div className="sanctuary-tiles" />
        </div>
      </div>
      <div className="sanctuary-col sanctuary-col-mid-l" />
      <div className="sanctuary-col sanctuary-col-mid-r" />
      <div className="sanctuary-crystal sanctuary-crystal-l" />
      <div className="sanctuary-crystal sanctuary-crystal-r" />
      <div className="sanctuary-altar">
        {discovered ? null : <div className="sanctuary-seal" />}
        <div className="sanctuary-altar-top" />
        <div className="sanctuary-altar-step" />
      </div>
      {MOTES.map((mote) => (
        <span
          key={`${mote.left}-${mote.top}`}
          className="sanctuary-mote"
          style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
        />
      ))}
      <div className="sanctuary-frame sanctuary-frame-l" />
      <div className="sanctuary-frame sanctuary-frame-r" />
    </div>
  );
}
