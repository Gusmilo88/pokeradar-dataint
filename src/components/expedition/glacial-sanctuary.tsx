"use client";

import { useEffect, useId, useRef } from "react";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import type { DossierEntry, DossierPhase } from "@/components/expedition/use-dossier";
import type { Enclave } from "@/lib/expedition/enclaves";
import { statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";

const MOTES = [
  { left: "24%", top: "62%", delay: "0s" },
  { left: "38%", top: "48%", delay: "1.6s" },
  { left: "54%", top: "36%", delay: "0.8s" },
  { left: "68%", top: "54%", delay: "2.2s" },
  { left: "46%", top: "28%", delay: "1.1s" },
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
        <GlacialStage discovered={discovered} ceremony={ceremony} charging={loading && ceremony} />
        <p className="sr-only">
          Cámara de hielo. Muros irregulares, un altar ritual al centro y una luz fría desde arriba.
        </p>
        {discovered && spriteId && label ? (
          <div className={ceremony ? "sanctuary-presence sanctuary-presence-rite" : "sanctuary-presence"}>
            {ceremony ? <span className="sanctuary-halo" /> : null}
            <CreatureSprite
              nationalId={spriteId}
              revealed
              label={label}
              stillUrl={entry?.pokemon.sprites.blackWhite}
              animatedUrl={entry?.pokemon.sprites.blackWhiteAnimated}
            />
          </div>
        ) : null}
      </div>
      <div className="sanctuary-log shrink-0">
        <div className="scroll-thin max-h-[32vh] overflow-y-auto px-4 pt-3 pb-2 sm:px-6">
          {ceremony && discovered ? (
            <p className="sanctuary-omen">La señal toma forma.</p>
          ) : (
            <p className="font-mono text-[10px] tracking-[0.18em] text-[#8ef6df] uppercase">
              {enclave.region}
            </p>
          )}
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
  charging,
}: {
  discovered: boolean;
  ceremony: boolean;
  charging: boolean;
}) {
  const rite = ceremony && discovered;
  return (
    <div
      className="sanctuary-stage"
      data-ceremony={rite ? "true" : "false"}
      data-charging={charging ? "true" : "false"}
      aria-hidden="true"
    >
      <svg className="sanctuary-cave" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice">
        <rect width="400" height="240" fill="#07131c" />
        <ellipse cx="200" cy="8" rx="150" ry="78" fill="#123e52" opacity="0.9" />
        <ellipse cx="200" cy="0" rx="90" ry="48" fill="#1a6a84" opacity="0.55" />
        <path d="M28 168 L62 92 L98 118 L132 64 L168 96 L200 42 L236 88 L274 58 L318 104 L352 78 L382 168 Z" fill="#0e3a4c" />
        <path d="M78 168 L112 104 L156 78 L200 58 L248 82 L292 108 L334 168 Z" fill="#18607a" />
        <path d="M156 78 L168 122 L152 168" fill="none" stroke="#d7fbff" strokeOpacity="0.35" strokeWidth="1.2" />
        <path d="M248 82 L236 128 L258 168" fill="none" stroke="#b7f6ff" strokeOpacity="0.28" strokeWidth="1" />
        <path d="M200 42 L206 70 L194 58 L200 42" fill="#e7fffb" />
        <path d="M132 64 L138 92 L126 78 Z" fill="#c9f6ff" opacity="0.8" />
        <path d="M274 58 L282 88 L266 74 Z" fill="#d7fbff" opacity="0.75" />
        <path d="M168 96 L172 118 L164 108 Z" fill="#9ee7f2" opacity="0.7" />
        <path d="M0 28 L74 86 L52 240 L0 240 Z" fill="#061018" />
        <path d="M0 96 L42 124 L28 240 L0 240 Z" fill="#0c2e3e" />
        <path d="M400 36 L328 92 L354 240 L400 240 Z" fill="#061018" />
        <path d="M400 108 L356 132 L372 240 L400 240 Z" fill="#0c2e3e" />
        <path d="M18 176 C90 156 150 168 200 160 C262 150 320 166 388 154 L400 240 L0 240 Z" fill="#12556c" />
        <path d="M64 186 C120 172 168 182 214 174 C268 166 318 180 360 172 L348 214 C286 202 230 214 168 206 C112 198 78 210 48 198 Z" fill="#1f86a4" opacity="0.9" />
        <path d="M96 192 L148 206 L128 228" fill="none" stroke="#e7fffb" strokeOpacity="0.32" strokeWidth="1.1" />
        <path d="M230 180 L268 198 L292 188" fill="none" stroke="#d7fbff" strokeOpacity="0.28" strokeWidth="1" />
        <path d="M150 210 L176 222 L168 234" fill="none" stroke="#9adff0" strokeOpacity="0.4" strokeWidth="1" />
        <ellipse cx="200" cy="196" rx="78" ry="10" fill="#06202c" opacity="0.28" />
        <path d="M86 176 L96 128 L104 136 L112 92 L122 104 L132 176 Z" fill="#2f7f98" />
        <path d="M96 128 L112 92 L118 100 L104 136 Z" fill="#d8fbff" />
        <path d="M268 176 L278 118 L288 126 L300 84 L310 98 L322 176 Z" fill="#2a7590" />
        <path d="M288 126 L300 84 L308 94 L290 122 Z" fill="#e7fffb" />
        <path d="M48 188 L56 150 L66 188 Z" fill="#8edff0" opacity="0.85" />
        <path d="M338 184 L350 142 L362 184 Z" fill="#b7f3ff" opacity="0.8" />
        <path d="M118 196 L128 168 L140 196 Z" fill="#7dffc3" opacity="0.75" />
        <path d="M248 198 L260 162 L274 198 Z" fill="#8b7cff" opacity="0.7" />
      </svg>
      <div className="sanctuary-beam" />
      <div className="sanctuary-mist" />
      <div className="sanctuary-altar">
        {discovered && !rite ? null : <div className={rite ? "sanctuary-seal sanctuary-seal-break" : "sanctuary-seal"} />}
        <div className="sanctuary-ring" />
        <div className="sanctuary-altar-top" />
        <div className="sanctuary-altar-step" />
        <div className="sanctuary-plinth" />
      </div>
      {MOTES.map((mote) => (
        <span
          key={`${mote.left}-${mote.top}`}
          className="sanctuary-mote"
          style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
        />
      ))}
      {rite ? <div className="sanctuary-flash" /> : null}
    </div>
  );
}
