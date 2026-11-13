"use client";

import { useEffect, useId, useState } from "react";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import type { DossierEntry, DossierPhase } from "@/components/expedition/use-dossier";
import type { Enclave } from "@/lib/expedition/enclaves";
import { statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";

const ART_WIDTH = 1672;
const ART_HEIGHT = 941;
const EXTERIOR_SRC = "/images/enclaves/articuno/entrada-santuario-glacial.webp";
const INTERIOR_SRC = "/images/enclaves/articuno/interior-santuario-glacial.webp";

/** Pies de la criatura, en fracciones del arte original 1672×941. */
const PERCH = { x: 50, y: 55, size: 16 };

const SNOW = [
  { left: "6%", delay: "0s", duration: "9s", size: "3px" },
  { left: "14%", delay: "1.4s", duration: "11s", size: "2px" },
  { left: "23%", delay: "0.6s", duration: "8s", size: "4px" },
  { left: "31%", delay: "2.2s", duration: "12s", size: "2px" },
  { left: "39%", delay: "0.2s", duration: "10s", size: "3px" },
  { left: "48%", delay: "1.8s", duration: "9.5s", size: "2px" },
  { left: "57%", delay: "0.9s", duration: "11.5s", size: "4px" },
  { left: "64%", delay: "2.6s", duration: "8.5s", size: "2px" },
  { left: "72%", delay: "0.4s", duration: "10.5s", size: "3px" },
  { left: "81%", delay: "1.6s", duration: "12.5s", size: "2px" },
  { left: "88%", delay: "2.8s", duration: "9s", size: "4px" },
  { left: "94%", delay: "1.1s", duration: "11s", size: "3px" },
] as const;

const MOTES = [
  { left: "22%", top: "58%", delay: "0s" },
  { left: "36%", top: "42%", delay: "1.5s" },
  { left: "61%", top: "36%", delay: "0.7s" },
  { left: "74%", top: "52%", delay: "2.1s" },
  { left: "48%", top: "24%", delay: "1.2s" },
] as const;

/**
 * Visita al Santuario Glacial sobre las ilustraciones originales.
 * El sprite y los efectos comparten el marco del arte, en coordenadas relativas.
 */
export function GlacialSanctuary({
  stage,
  enclave,
  phase,
  discovered,
  ceremony,
  entry,
  spriteId,
  label,
  onExamine,
  onRetry,
  onEnter,
  onExterior,
  onLeave,
}: {
  stage: "exterior" | "interior";
  enclave: Enclave;
  phase: DossierPhase;
  discovered: boolean;
  ceremony: boolean;
  entry: DossierEntry | null;
  spriteId: number | null;
  label: string | null;
  onExamine: () => void;
  onRetry: () => void;
  onEnter: () => void;
  onExterior: () => void;
  onLeave: () => void;
}) {
  const titleId = useId();
  const src = stage === "exterior" ? EXTERIOR_SRC : INTERIOR_SRC;
  const [skipStage, setSkipStage] = useState<"exterior" | "interior" | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const skipped = skipStage === stage;
  const artFailed = failedSrc === src;
  const loading = stage === "interior" && !discovered && phase === "loading";
  const failed = stage === "interior" && !discovered && phase === "error";
  const statsFailed = stage === "interior" && discovered && phase === "error";
  const rite = stage === "interior" && ceremony && discovered && !skipped;

  useEffect(() => {
    if (stage !== "exterior") {
      return;
    }
    const preload = new Image();
    preload.src = INTERIOR_SRC;
  }, [stage]);

  useEffect(() => {
    function onHide() {
      setPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

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
      className="enclave-visit"
      data-paused={paused ? "true" : "false"}
      data-rite={rite ? "true" : "false"}
      data-charging={loading ? "true" : "false"}
      data-skipped={skipped ? "true" : "false"}
    >
      <div className="enclave-scroll">
        <div className="art-frame" style={{ aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}` }}>
          {artFailed ? (
            <p className="art-fallback">La ilustración no cargó. La señal sigue en el lugar.</p>
          ) : (
            // El archivo ya está en WebP. next/image lo volvería a procesar.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              width={ART_WIDTH}
              height={ART_HEIGHT}
              className="art-plate"
              decoding="async"
              onError={() => setFailedSrc(src)}
            />
          )}
          <div className="art-layer" aria-hidden="true">
            {stage === "exterior" ? <ExteriorWeather /> : <InteriorWeather charging={loading} rite={rite} />}
            {stage === "interior" && spriteId && label ? (
              <div
                className={rite ? "perch perch-rite" : "perch"}
                style={{ left: `${PERCH.x}%`, top: `${PERCH.y}%`, width: `${PERCH.size}%` }}
              >
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
        </div>
      </div>
      <div className="enclave-dock">
        <p className="font-mono text-[10px] tracking-[0.18em] text-[#8ef6df] uppercase">{enclave.region}</p>
        {rite ? <p className="sanctuary-omen">Presencia legendaria descubierta</p> : null}
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-[#f4fffd]">
            {stage === "interior" && discovered && label ? label : enclave.place}
          </h2>
          {stage === "interior" && discovered ? <span className="sanctuary-chip">Visto</span> : null}
        </div>
        {stage === "exterior" ? (
          <p className="mt-2 text-sm leading-6 text-[#d5eef2]">
            {discovered && label
              ? `${label} ya está en la bitácora. La entrada sigue abierta.`
              : "La boca del hielo respira luz. Adentro, la señal todavía no tiene nombre."}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-2 text-sm text-[#d5eef2]" aria-busy="true">
            La señal responde. Consultando PokéAPI.
          </p>
        ) : null}
        {failed ? (
          <p className="mt-2 text-sm text-[#d5eef2]" role="alert">
            PokéAPI no respondió. La señal sigue sin identificar.
          </p>
        ) : null}
        {statsFailed ? (
          <p className="mt-2 text-sm text-[#d5eef2]" role="alert">
            La ficha no llegó. Sigue registrada como vista.
          </p>
        ) : null}
        {stage === "interior" && !loading && !failed && !discovered ? (
          <p className="mt-2 text-sm leading-6 text-[#d5eef2]">{enclave.sealed}</p>
        ) : null}
        {stage === "interior" && discovered && entry ? (
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
        <div className="mt-3 flex flex-wrap gap-2">
          {stage === "exterior" ? (
            <button
              type="button"
              className="action-button inline-flex min-h-11 items-center justify-center"
              onClick={onEnter}
              autoFocus
            >
              Entrar al santuario
            </button>
          ) : null}
          {stage === "interior" && rite ? (
            <button
              type="button"
              className="action-button inline-flex min-h-11 items-center justify-center"
              onClick={() => setSkipStage(stage)}
              autoFocus
            >
              Omitir
            </button>
          ) : null}
          {stage === "interior" && !discovered && !loading && !failed ? (
            <button
              type="button"
              className="action-button inline-flex min-h-11 items-center justify-center"
              onClick={onExamine}
              autoFocus
            >
              Examinar la señal
            </button>
          ) : null}
          {failed || statsFailed ? (
            <button
              type="button"
              className="action-button inline-flex min-h-11 items-center justify-center"
              onClick={onRetry}
            >
              Reintentar
            </button>
          ) : null}
          {stage === "interior" ? (
            <button
              type="button"
              className="action-button inline-flex min-h-11 items-center justify-center"
              onClick={onExterior}
            >
              Volver afuera
            </button>
          ) : null}
          <button
            type="button"
            className="action-button inline-flex min-h-11 items-center justify-center"
            onClick={onLeave}
            autoFocus={stage === "interior" && discovered && !rite}
          >
            Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}

function ExteriorWeather() {
  return (
    <>
      <div className="aurora-veil" />
      <div className="mouth-glow" />
      <div className="cold-mist" />
      {SNOW.map((flake) => (
        <span
          key={flake.left}
          className="snow-flake"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
          }}
        />
      ))}
    </>
  );
}

function InteriorWeather({ charging, rite }: { charging: boolean; rite: boolean }) {
  return (
    <>
      <div className={charging || rite ? "altar-glow altar-glow-hot" : "altar-glow"} />
      <span className="crystal-glint crystal-glint-l" />
      <span className="crystal-glint crystal-glint-r" />
      <div className="cold-mist" />
      {MOTES.map((mote) => (
        <span
          key={`${mote.left}-${mote.top}`}
          className="sanctuary-mote"
          style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
        />
      ))}
      {rite ? <div className="rite-flash" /> : null}
    </>
  );
}
