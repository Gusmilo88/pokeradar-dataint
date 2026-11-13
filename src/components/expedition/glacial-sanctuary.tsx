"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import type { DossierEntry, DossierPhase } from "@/components/expedition/use-dossier";
import type { Enclave } from "@/lib/expedition/enclaves";
import { statLabel, typeLabel } from "@/lib/pokeapi/labels";

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
        <GlacialStage discovered={discovered} />
        <p className="sr-only">
          Santuario de hielo. Columnas al fondo, un sello en el centro y una luz quieta.
        </p>
        {discovered && spriteId && label ? (
          <motion.div
            className="absolute bottom-[18%] left-1/2 h-28 w-28 -translate-x-1/2 sm:h-36 sm:w-36"
            initial={ceremony ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <CreatureSprite
              nationalId={spriteId}
              revealed
              label={label}
              stillUrl={entry?.pokemon.sprites.blackWhite}
              animatedUrl={entry?.pokemon.sprites.blackWhiteAnimated}
            />
          </motion.div>
        ) : null}
      </div>
      <div className="shrink-0 border-t border-[#7ec8d6]/30 bg-[#07141c]">
        <div className="scroll-thin max-h-[34vh] overflow-y-auto px-4 py-3 sm:px-6">
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#9fd6e4] uppercase">
            {enclave.region}
          </p>
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-[#e7f6f2]">
            {discovered && label ? label : enclave.place}
          </h2>
          {loading ? (
            <p className="mt-2 text-sm text-[#b7d4ce]" aria-busy="true">
              La señal responde. Consultando PokéAPI.
            </p>
          ) : null}
          {failed ? (
            <p className="mt-2 text-sm text-[#b7d4ce]" role="alert">
              PokéAPI no respondió. La señal sigue sin identificar.
            </p>
          ) : null}
          {statsFailed ? (
            <p className="mt-2 text-sm text-[#b7d4ce]" role="alert">
              La ficha no llegó. Sigue registrada como vista.
            </p>
          ) : null}
          {!loading && !failed && !discovered ? (
            <p className="mt-2 text-sm leading-6 text-[#b7d4ce]">{enclave.sealed}</p>
          ) : null}
          {discovered && entry ? (
            <>
              <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-[#f2c14e] uppercase">
                Visto
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {entry.pokemon.types.map((slot) => (
                  <span
                    key={slot.type.name}
                    className="border border-[#7ec8d6]/50 px-2 py-0.5 font-mono text-[11px] tracking-[0.08em] text-[#d7f6ff] uppercase"
                  >
                    {typeLabel(slot.type.name)}
                  </span>
                ))}
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                {entry.pokemon.stats.map((stat) => (
                  <li key={stat.stat.name} className="flex justify-between gap-2 font-mono text-[11px] text-[#b7d4ce]">
                    <span>{statLabel(stat.stat.name)}</span>
                    <span className="text-[#e7f6f2]">{stat.base_stat}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {discovered && !entry ? (
            <p className="mt-2 text-sm text-[#b7d4ce]">La presencia ya está en la bitácora.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[#7ec8d6]/15 px-4 py-3 sm:px-6">
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

function GlacialStage({ discovered }: { discovered: boolean }) {
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMax slice"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect width="320" height="180" fill="#0d2433" />
      <polygon points="36,22 160,8 284,26 230,104 90,104" fill="#1d5872" />
      <rect x="78" y="34" width="18" height="70" fill="#3d8ea8" />
      <rect x="114" y="20" width="24" height="84" fill="#67b7cc" />
      <rect x="170" y="28" width="16" height="76" fill="#3d8ea8" />
      <rect x="198" y="40" width="22" height="64" fill="#2f7490" />
      <polygon className="sanctuary-beam" points="152,0 128,108 184,108" fill="#f4fbff" opacity="0.55" />
      <polygon points="16,108 304,108 320,180 0,180" fill="#16485e" />
      <polygon points="64,108 256,108 280,180 40,180" fill="#1f6d88" />
      <polygon points="112,108 208,108 220,180 100,180" fill="#2f8eab" />
      <polygon points="0,64 46,76 58,180 0,180" fill="#071820" />
      <polygon points="274,76 320,64 320,180 262,180" fill="#071820" />
      <rect x="86" y="124" width="12" height="8" fill="#d7f6ff" />
      <rect x="220" y="132" width="10" height="6" fill="#d7f6ff" />
      {discovered ? null : (
        <g className="sanctuary-seal">
          <polygon points="160,72 204,118 160,164 116,118" fill="#f4fbff" />
          <polygon points="160,92 182,118 160,144 138,118" fill="#f2c14e" />
        </g>
      )}
    </svg>
  );
}
