"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { CapturePanel } from "@/components/expedition/capture-panel";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import type { DossierEntry, DossierPhase } from "@/components/expedition/use-dossier";
import { paletteVars, type Enclave } from "@/lib/expedition/enclaves";
import { statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";

const ART_WIDTH = 1672;
const ART_HEIGHT = 941;

const SCENE = {
  glacial: {
    exterior: "/images/enclaves/articuno/entrada-santuario-glacial.webp",
    interior: "/images/enclaves/articuno/interior-santuario-glacial.webp",
    bias: "-66%",
    pulse: "51%",
    mouthX: "68%",
    mouthY: "46%",
    perch: { x: 50, y: 55, size: 16 },
  },
  storm: {
    exterior: "/images/enclaves/zapdos/entrada-central-electrica-abandonad.webp",
    interior: "/images/enclaves/zapdos/interior-central-electrica-abandonada.webp",
    bias: "-76%",
    pulse: "54%",
    mouthX: "76%",
    mouthY: "57%",
    perch: { x: 50, y: 58, size: 16 },
  },
  ember: {
    exterior: "/images/enclaves/moltres/entrada-santuario-volcanico.webp",
    interior: "/images/enclaves/moltres/interior-santuario-volcanico.webp",
    bias: "-80%",
    pulse: "55%",
    mouthX: "80%",
    mouthY: "50%",
    perch: { x: 50, y: 58, size: 16 },
  },
  fossil: {
    exterior: "/images/enclaves/aerodactyl/entrada-caverna-fosil.webp",
    interior: "/images/enclaves/aerodactyl/interior-caverna-fosil.webp",
    bias: "-72%",
    pulse: "57%",
    mouthX: "72%",
    mouthY: "48%",
    perch: { x: 50, y: 60, size: 18 },
  },
  lab: {
    exterior: "/images/enclaves/mewtwo/entrada-laboratorio-secreto.webp",
    interior: "/images/enclaves/mewtwo/interior-laboratorio-secreto.webp",
    bias: "-75%",
    pulse: "62%",
    mouthX: "75%",
    mouthY: "58%",
    perch: { x: 50, y: 66, size: 15 },
  },
  grove: {
    exterior: "/images/enclaves/mew/entrada-santuario-esmeralda.webp",
    interior: "/images/enclaves/mew/interior-santuario-esmeralda.webp",
    bias: "-76%",
    pulse: "58%",
    pulseX: "51%",
    mouthX: "77%",
    mouthY: "47%",
    perch: { x: 51, y: 52, size: 12 },
  },
} as const;

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

/** Destellos sobre el arte, en porcentajes de 1672×941. Fuera del cuerpo del sprite. */
const SPARKS = [
  { x: 36, y: 49, size: 1.35, delay: "0s", duration: "5.6s" },
  { x: 64, y: 49, size: 1.15, delay: "1.7s", duration: "6.2s" },
  { x: 22, y: 36, size: 0.9, delay: "2.4s", duration: "5.2s" },
  { x: 78, y: 36, size: 1.2, delay: "0.6s", duration: "6.4s" },
  { x: 43, y: 58, size: 0.8, delay: "3.1s", duration: "5.8s" },
  { x: 57, y: 58, size: 1, delay: "1.2s", duration: "6.8s" },
  { x: 50, y: 80, size: 1.25, delay: "2.8s", duration: "5.4s" },
  { x: 12, y: 70, size: 0.85, delay: "0.3s", duration: "7s" },
  { x: 88, y: 68, size: 1.05, delay: "2.1s", duration: "5.9s" },
  { x: 30, y: 58, size: 0.7, delay: "3.6s", duration: "6.1s" },
  { x: 70, y: 57, size: 0.8, delay: "1.4s", duration: "5.5s" },
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
  caught,
  onCaptured,
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
  caught: boolean;
  onCaptured: (encounterId: string) => void;
}) {
  const titleId = useId();
  const art = SCENE[enclave.scene];
  const src = stage === "exterior" ? art.exterior : art.interior;
  const [skipStage, setSkipStage] = useState<"exterior" | "interior" | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [sheetStage, setSheetStage] = useState<"exterior" | "interior" | null>(null);
  const [paused, setPaused] = useState(false);
  const skipped = skipStage === stage;
  const artFailed = failedSrc === src;
  const loading = stage === "interior" && !discovered && phase === "loading";
  const failed = stage === "interior" && !discovered && phase === "error";
  const statsFailed = stage === "interior" && discovered && phase === "error";
  const rite = stage === "interior" && ceremony && discovered && !skipped;
  const sheet = sheetStage === stage && discovered && entry !== null;
  const canExamine = stage === "interior" && !discovered && !loading && !failed;

  useEffect(() => {
    if (stage !== "exterior") {
      return;
    }
    const preload = new Image();
    preload.src = art.interior;
  }, [stage, art.interior]);

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
      data-scene={enclave.scene}
      data-stage={stage}
      style={
        {
          ...paletteVars(enclave.palette),
          "--cover-bias": art.bias,
          "--mouth-x": art.mouthX,
          "--mouth-y": art.mouthY,
        } as CSSProperties
      }
      data-paused={paused ? "true" : "false"}
      data-rite={rite ? "true" : "false"}
      data-charging={loading ? "true" : "false"}
      data-skipped={skipped ? "true" : "false"}
    >
      <div className="art-window">
        <div className="art-stage scene-fade" key={stage}>
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
            <SceneWeather scene={enclave.scene} stage={stage} charging={loading} rite={rite} />
            {stage === "interior" && spriteId && label ? (
              <div
                className={rite ? (enclave.scene === "grove" ? "perch perch-grove" : "perch perch-rite") : "perch"}
                style={{ left: `${art.perch.x}%`, top: `${art.perch.y}%`, width: `${art.perch.size}%` }}
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
          {canExamine || loading ? (
            <button
              type="button"
              className="altar-pulse"
              style={{ left: "pulseX" in art ? art.pulseX : "50%", top: art.pulse }}
              onClick={onExamine}
              disabled={loading}
              aria-busy={loading}
              autoFocus={canExamine}
            >
              <span className="altar-pulse-ring" aria-hidden="true" />
              <span className="altar-pulse-core" aria-hidden="true" />
              <span className="altar-pulse-label">
                {enclave.scene === "grove" ? "Examinar la señal de la isla" : "Examinar la señal del altar"}
              </span>
            </button>
          ) : null}
        </div>
      </div>
      <div className="scene-ui">
        <div className="scene-caption" key={rite ? "rite" : stage}>
          <p className="scene-kicker">{enclave.kicker}</p>
          <h2 id={titleId} className="scene-title">
            {rite
              ? (enclave.arrival ?? "¡Una presencia legendaria se ha manifestado!")
              : stage === "interior" && discovered && label
                ? label
                : enclave.place}
          </h2>
          {rite && label ? (
            <p className="scene-narration">
              {enclave.manifested ?? `${label} ha sido registrado en la Pokédex.`}
            </p>
          ) : (
            <p className="scene-narration" role={failed || statsFailed ? "alert" : undefined} aria-busy={loading || undefined}>
              {stage === "exterior"
                ? discovered && label
                  ? `${label} ya está en la bitácora. La entrada sigue abierta.`
                  : enclave.exterior
                : loading
                  ? "La señal responde. Consultando PokéAPI."
                  : failed
                    ? "PokéAPI no respondió. La señal sigue sin identificar."
                    : statsFailed
                      ? "La ficha no llegó. Sigue registrada como vista."
                      : discovered && label
                        ? (enclave.manifested ?? `${label} permanece sobre el altar.`)
                        : enclave.interior}
            </p>
          )}
          {sheet && entry ? <DossierSheet entry={entry} /> : null}
          {stage === "interior" && discovered && !rite && entry ? (
            <CapturePanel
              key={enclave.encounterId}
              encounterId={enclave.encounterId}
              captureRate={entry.species.capture_rate}
              baseStats={entry.pokemon.stats.map((stat) => stat.base_stat)}
              state={caught ? "caught" : "seen"}
              onCaptured={onCaptured}
            />
          ) : null}
          <div className="scene-actions">
            {stage === "exterior" ? (
              <button type="button" className="scene-btn scene-btn-go" onClick={onEnter} autoFocus>
                Entrar
              </button>
            ) : null}
            {rite ? (
              <button type="button" className="scene-btn" onClick={() => setSkipStage(stage)} autoFocus>
                Omitir
              </button>
            ) : null}
            {failed || statsFailed ? (
              <button type="button" className="scene-btn scene-btn-go" onClick={onRetry}>
                Reintentar
              </button>
            ) : null}
            {stage === "interior" && discovered && entry && !rite ? (
              <button
                type="button"
                className="scene-btn"
                onClick={() => setSheetStage(sheet ? null : stage)}
                aria-expanded={sheet}
              >
                {sheet ? "Cerrar ficha" : "Ver ficha"}
              </button>
            ) : null}
            {stage === "interior" ? (
              <button type="button" className="scene-btn" onClick={onExterior}>
                Volver afuera
              </button>
            ) : null}
            <button
              type="button"
              className="scene-btn"
              onClick={onLeave}
              autoFocus={stage === "interior" && discovered && !rite}
            >
              Volver al mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DossierSheet({ entry }: { entry: DossierEntry }) {
  return (
    <div className="scene-sheet">
      <p className="scene-types">
        {entry.pokemon.types.map((slot) => (
          <span key={slot.type.name}>{typeLabel(slot.type.name)}</span>
        ))}
      </p>
      <ul className="scene-stats">
        {entry.pokemon.stats.map((stat) => (
          <li key={stat.stat.name}>
            <span>{statLabel(stat.stat.name)}</span>
            <span>{stat.base_stat}</span>
            <span className="sanctuary-stat">
              <span style={{ width: `${Math.min(100, (stat.base_stat / STAT_SCALE) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SceneWeather({
  scene,
  stage,
  charging,
  rite,
}: {
  scene: Enclave["scene"];
  stage: "exterior" | "interior";
  charging: boolean;
  rite: boolean;
}) {
  if (scene === "storm") {
    return stage === "exterior" ? <StormExterior /> : <StormInterior charging={charging} rite={rite} />;
  }
  if (scene === "ember") {
    return stage === "exterior" ? <EmberExterior /> : <EmberInterior charging={charging} rite={rite} />;
  }
  if (scene === "fossil") {
    return stage === "exterior" ? <FossilExterior /> : <FossilInterior charging={charging} rite={rite} />;
  }
  if (scene === "lab") {
    return stage === "exterior" ? <LabExterior /> : <LabInterior charging={charging} rite={rite} />;
  }
  if (scene === "grove") {
    return stage === "exterior" ? <GroveExterior /> : <GroveInterior charging={charging} rite={rite} />;
  }
  return stage === "exterior" ? <ExteriorWeather /> : <InteriorWeather charging={charging} rite={rite} />;
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

const RAIN = [
  { left: "8%", delay: "0s", duration: "1.6s" },
  { left: "17%", delay: "0.4s", duration: "1.9s" },
  { left: "28%", delay: "0.2s", duration: "1.5s" },
  { left: "39%", delay: "0.8s", duration: "1.8s" },
  { left: "51%", delay: "0.1s", duration: "1.7s" },
  { left: "63%", delay: "0.6s", duration: "1.4s" },
  { left: "74%", delay: "0.3s", duration: "1.9s" },
  { left: "86%", delay: "0.9s", duration: "1.6s" },
] as const;

const STORM_SPARKS = [
  { x: 22, y: 40, size: 1.1, delay: "0s", duration: "4.8s" },
  { x: 78, y: 40, size: 1.2, delay: "1.4s", duration: "5.4s" },
  { x: 30, y: 62, size: 0.9, delay: "0.7s", duration: "5.1s" },
  { x: 70, y: 62, size: 1, delay: "2.1s", duration: "4.6s" },
  { x: 14, y: 55, size: 0.8, delay: "1.8s", duration: "5.6s" },
  { x: 86, y: 54, size: 0.85, delay: "0.5s", duration: "5s" },
  { x: 40, y: 72, size: 0.7, delay: "2.6s", duration: "4.4s" },
  { x: 60, y: 72, size: 0.75, delay: "1.1s", duration: "5.2s" },
] as const;

function StormExterior() {
  return (
    <>
      <div className="storm-veil" />
      <div className="mouth-glow" />
      <span className="storm-bolt" style={{ left: "22%", top: "6%" }} />
      <span className="storm-bolt storm-bolt-late" style={{ left: "68%", top: "4%" }} />
      {RAIN.map((drop) => (
        <span
          key={drop.left}
          className="rain-drop"
          style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }}
        />
      ))}
    </>
  );
}

function StormInterior({ charging, rite }: { charging: boolean; rite: boolean }) {
  return (
    <>
      <div className={charging || rite ? "altar-glow altar-glow-hot" : "altar-glow"} />
      {STORM_SPARKS.map((spark) => (
        <span
          key={`${spark.x}-${spark.y}`}
          className="ice-spark"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: `${spark.size}%`,
            animationDelay: spark.delay,
            animationDuration: spark.duration,
          }}
        />
      ))}
      <span className="storm-bolt" style={{ left: "34%", top: "8%" }} />
      <span className="storm-bolt storm-bolt-late" style={{ left: "66%", top: "10%" }} />
      {rite ? <div className="rite-flash" /> : null}
    </>
  );
}

const EMBERS = [
  { left: "12%", delay: "0s", duration: "11s", size: "4px" },
  { left: "24%", delay: "2.4s", duration: "13s", size: "3px" },
  { left: "37%", delay: "1.1s", duration: "10s", size: "5px" },
  { left: "49%", delay: "3.2s", duration: "14s", size: "3px" },
  { left: "61%", delay: "0.6s", duration: "12s", size: "4px" },
  { left: "73%", delay: "2.8s", duration: "11s", size: "3px" },
  { left: "84%", delay: "1.6s", duration: "13s", size: "5px" },
  { left: "92%", delay: "0.3s", duration: "10.5s", size: "3px" },
] as const;

const EMBER_MOTES = [
  { x: 28, y: 46, delay: "0s" },
  { x: 72, y: 44, delay: "1.4s" },
  { x: 38, y: 68, delay: "0.8s" },
  { x: 62, y: 70, delay: "2.2s" },
  { x: 18, y: 62, delay: "1.7s" },
  { x: 82, y: 60, delay: "0.4s" },
] as const;

const EMBER_SPARKS = [
  { x: 24, y: 38, size: 1.1, delay: "0s", duration: "5.2s" },
  { x: 76, y: 36, size: 1.2, delay: "1.6s", duration: "5.8s" },
  { x: 34, y: 64, size: 0.85, delay: "0.7s", duration: "4.8s" },
  { x: 66, y: 66, size: 0.9, delay: "2.2s", duration: "5.4s" },
  { x: 14, y: 52, size: 0.75, delay: "1.3s", duration: "6s" },
  { x: 86, y: 50, size: 0.8, delay: "2.8s", duration: "4.6s" },
] as const;

function EmberExterior() {
  return (
    <>
      <div className="ember-veil" />
      <div className="mouth-glow" />
      <div className="steam" />
      {EMBERS.map((ember) => (
        <span
          key={ember.left}
          className="ember"
          style={{
            left: ember.left,
            width: ember.size,
            height: ember.size,
            animationDelay: ember.delay,
            animationDuration: ember.duration,
          }}
        />
      ))}
    </>
  );
}

function EmberInterior({ charging, rite }: { charging: boolean; rite: boolean }) {
  return (
    <>
      <div className={charging || rite ? "altar-glow altar-glow-hot" : "altar-glow"} />
      {EMBER_SPARKS.map((spark) => (
        <span
          key={`${spark.x}-${spark.y}`}
          className="ice-spark"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: `${spark.size}%`,
            animationDelay: spark.delay,
            animationDuration: spark.duration,
          }}
        />
      ))}
      {EMBER_MOTES.map((mote) => (
        <span
          key={`${mote.x}-${mote.y}`}
          className="ember-mote"
          style={{ left: `${mote.x}%`, top: `${mote.y}%`, animationDelay: mote.delay }}
        />
      ))}
      {rite ? <div className="rite-flash" /> : null}
    </>
  );
}

const FOSSIL_DUST = [
  { left: "12%", top: "38%", delay: "0s", duration: "16s" },
  { left: "28%", top: "52%", delay: "3.2s", duration: "18s" },
  { left: "44%", top: "30%", delay: "1.4s", duration: "15s" },
  { left: "58%", top: "46%", delay: "4.6s", duration: "17s" },
  { left: "70%", top: "34%", delay: "0.8s", duration: "19s" },
  { left: "82%", top: "58%", delay: "2.5s", duration: "16s" },
  { left: "36%", top: "68%", delay: "5.1s", duration: "18s" },
  { left: "64%", top: "72%", delay: "1.9s", duration: "15s" },
] as const;

const FOSSIL_GLINTS = [
  { x: 46, y: 62, delay: "0.4s", duration: "8.2s" },
  { x: 87, y: 62, delay: "2.8s", duration: "7.6s" },
  { x: 38, y: 54, delay: "5.2s", duration: "9s" },
  { x: 71, y: 74, delay: "1.6s", duration: "8.6s" },
] as const;

const FOSSIL_CAVE_GLINTS = [
  { x: 16, y: 84, delay: "0.6s", duration: "7.4s" },
  { x: 86, y: 82, delay: "3.4s", duration: "8.8s" },
  { x: 30, y: 62, delay: "1.8s", duration: "7.8s" },
  { x: 68, y: 58, delay: "4.2s", duration: "8.2s" },
  { x: 20, y: 40, delay: "2.2s", duration: "9.4s" },
] as const;

function FossilExterior() {
  return (
    <>
      <span className="fossil-ray" style={{ left: "6%", animationDelay: "0s" }} />
      <span className="fossil-ray fossil-ray-late" style={{ left: "22%" }} />
      <div className="mouth-glow" />
      {FOSSIL_DUST.map((speck) => (
        <span
          key={`${speck.left}-${speck.top}`}
          className="fossil-dust"
          style={{
            left: speck.left,
            top: speck.top,
            animationDelay: speck.delay,
            animationDuration: speck.duration,
          }}
        />
      ))}
      {FOSSIL_GLINTS.map((glint) => (
        <span
          key={`${glint.x}-${glint.y}`}
          className="fossil-glint"
          style={{
            left: `${glint.x}%`,
            top: `${glint.y}%`,
            animationDelay: glint.delay,
            animationDuration: glint.duration,
          }}
        />
      ))}
    </>
  );
}

function FossilInterior({ charging, rite }: { charging: boolean; rite: boolean }) {
  return (
    <>
      <div className="fossil-shaft" />
      <div className={charging || rite ? "altar-glow altar-glow-hot" : "altar-glow"} />
      {FOSSIL_DUST.map((speck) => (
        <span
          key={`${speck.left}-${speck.top}`}
          className="fossil-mote"
          style={{
            left: speck.left,
            top: speck.top,
            animationDelay: speck.delay,
            animationDuration: speck.duration,
          }}
        />
      ))}
      {FOSSIL_CAVE_GLINTS.map((glint) => (
        <span
          key={`${glint.x}-${glint.y}`}
          className="fossil-glint"
          style={{
            left: `${glint.x}%`,
            top: `${glint.y}%`,
            animationDelay: glint.delay,
            animationDuration: glint.duration,
          }}
        />
      ))}
      {rite ? (
        <>
          <div className="fossil-wake" />
          <div className="fossil-shade" />
        </>
      ) : null}
    </>
  );
}

function InteriorWeather({ charging, rite }: { charging: boolean; rite: boolean }) {
  return (
    <>
      <div className={charging || rite ? "altar-glow altar-glow-hot" : "altar-glow"} />
      {SPARKS.map((spark) => (
        <span
          key={`${spark.x}-${spark.y}`}
          className="ice-spark"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: `${spark.size}%`,
            animationDelay: spark.delay,
            animationDuration: spark.duration,
          }}
        />
      ))}
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

const LAB_LAMPS = [
  { x: 64, y: 46, delay: "0s" },
  { x: 86, y: 42, delay: "1.4s" },
  { x: 38, y: 16, delay: "2.6s" },
] as const;

const LAB_SPARKS = [
  { x: 75, y: 52, delay: "0.2s" },
  { x: 75, y: 64, delay: "1.8s" },
  { x: 28, y: 22, delay: "3.1s" },
] as const;

const LAB_SCREENS = [
  { x: 16, y: 44, delay: "0s" },
  { x: 82, y: 46, delay: "1.6s" },
] as const;

const LAB_MOTES = [
  { x: 46, y: 48, delay: "0s", duration: "9s" },
  { x: 54, y: 42, delay: "2.2s", duration: "11s" },
  { x: 42, y: 58, delay: "4.1s", duration: "10s" },
  { x: 58, y: 56, delay: "1.1s", duration: "12s" },
] as const;

const LAB_GLITCH = [
  { x: 18, y: 42, delay: "0.4s" },
  { x: 84, y: 48, delay: "2.8s" },
  { x: 48, y: 36, delay: "4.6s" },
] as const;

function LabExterior() {
  return (
    <>
      <div className="lab-fog" />
      <div className="lab-door" />
      {LAB_LAMPS.map((lamp) => (
        <span
          key={`${lamp.x}-${lamp.y}`}
          className="lab-lamp"
          style={{ left: `${lamp.x}%`, top: `${lamp.y}%`, animationDelay: lamp.delay }}
        />
      ))}
      {LAB_SPARKS.map((spark) => (
        <span
          key={`${spark.x}-${spark.y}`}
          className="lab-spark"
          style={{ left: `${spark.x}%`, top: `${spark.y}%`, animationDelay: spark.delay }}
        />
      ))}
    </>
  );
}

function LabInterior({ charging, rite }: { charging: boolean; rite: boolean }) {
  return (
    <>
      <div className={charging || rite ? "lab-tube lab-tube-hot" : "lab-tube"} />
      <div className={charging || rite ? "altar-glow altar-glow-hot" : "altar-glow"} />
      {LAB_SCREENS.map((screen) => (
        <span
          key={`${screen.x}-${screen.y}`}
          className="lab-screen"
          style={{ left: `${screen.x}%`, top: `${screen.y}%`, animationDelay: screen.delay }}
        />
      ))}
      <div className="lab-vapor" />
      {LAB_MOTES.map((mote) => (
        <span
          key={`${mote.x}-${mote.y}`}
          className="lab-mote"
          style={{
            left: `${mote.x}%`,
            top: `${mote.y}%`,
            animationDelay: mote.delay,
            animationDuration: mote.duration,
          }}
        />
      ))}
      {LAB_GLITCH.map((glitch) => (
        <span
          key={`${glitch.x}-${glitch.y}`}
          className="lab-glitch"
          style={{ left: `${glitch.x}%`, top: `${glitch.y}%`, animationDelay: glitch.delay }}
        />
      ))}
      {rite ? (
        <>
          <div className="lab-gather" />
          <div className="lab-shade" />
          <div className="lab-psi" />
        </>
      ) : null}
    </>
  );
}

/** Luces a lo largo del sendero y del arco, no repartidas por el cielo. */
const GROVE_ORBS = [
  { x: 70, y: 44, delay: "0s", duration: "4.6s" },
  { x: 78, y: 40, delay: "1.2s", duration: "5.2s" },
  { x: 74, y: 52, delay: "0.6s", duration: "4.8s" },
  { x: 66, y: 58, delay: "2.1s", duration: "5.4s" },
  { x: 82, y: 56, delay: "1.6s", duration: "4.4s" },
  { x: 72, y: 64, delay: "0.3s", duration: "5.6s" },
  { x: 60, y: 70, delay: "2.4s", duration: "5s" },
] as const;

const GROVE_ISLE_ORBS = [
  { x: 44, y: 50, delay: "0s", duration: "5s" },
  { x: 58, y: 48, delay: "1.4s", duration: "4.6s" },
  { x: 48, y: 42, delay: "0.8s", duration: "5.4s" },
  { x: 56, y: 56, delay: "2.2s", duration: "4.8s" },
  { x: 40, y: 54, delay: "1.1s", duration: "5.2s" },
] as const;

const GROVE_GLINTS = [
  { x: 24, y: 34, delay: "0.4s" },
  { x: 76, y: 30, delay: "1.8s" },
  { x: 32, y: 22, delay: "2.6s" },
  { x: 68, y: 24, delay: "0.9s" },
] as const;

const GROVE_PETALS = [
  { left: "16%", delay: "0s", duration: "15s" },
  { left: "74%", delay: "4.2s", duration: "17s" },
  { left: "48%", delay: "7s", duration: "16s" },
  { left: "86%", delay: "2.2s", duration: "14s" },
] as const;

const GROVE_WINGS = [
  { x: 24, y: 74, delay: "0s" },
  { x: 88, y: 36, delay: "2.4s" },
] as const;

const GROVE_RIPPLES = [
  { x: 42, y: 72, width: "14%", delay: "0s" },
  { x: 58, y: 76, width: "10%", delay: "1.6s" },
  { x: 50, y: 82, width: "16%", delay: "0.8s" },
] as const;

const GROVE_GATHER = [
  { x: 28, y: 34 },
  { x: 70, y: 30 },
  { x: 36, y: 62 },
  { x: 66, y: 58 },
  { x: 50, y: 26 },
] as const;

function GroveExterior() {
  return (
    <>
      <div className="grove-ray" />
      <div className="grove-mouth" />
      {GROVE_ORBS.map((orb) => (
        <span
          key={`${orb.x}-${orb.y}`}
          className="grove-orb"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
          }}
        />
      ))}
      {GROVE_GLINTS.map((glint) => (
        <span
          key={`${glint.x}-${glint.y}`}
          className="grove-glint"
          style={{ left: `${glint.x}%`, top: `${glint.y}%`, animationDelay: glint.delay }}
        />
      ))}
      {GROVE_PETALS.map((petal) => (
        <span
          key={petal.left}
          className="grove-petal"
          style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.duration }}
        />
      ))}
      {GROVE_WINGS.map((wing) => (
        <span
          key={`${wing.x}-${wing.y}`}
          className="grove-wing"
          style={{ left: `${wing.x}%`, top: `${wing.y}%`, animationDelay: wing.delay }}
        />
      ))}
    </>
  );
}

function GroveInterior({ charging, rite }: { charging: boolean; rite: boolean }) {
  return (
    <>
      <div className="grove-ray grove-ray-soft" />
      {GROVE_ISLE_ORBS.map((orb) => (
        <span
          key={`${orb.x}-${orb.y}`}
          className={charging ? "grove-orb grove-orb-live" : "grove-orb"}
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
          }}
        />
      ))}
      {GROVE_GLINTS.map((glint) => (
        <span
          key={`${glint.x}-${glint.y}`}
          className="grove-glint"
          style={{ left: `${glint.x}%`, top: `${glint.y}%`, animationDelay: glint.delay }}
        />
      ))}
      {GROVE_RIPPLES.map((ripple) => (
        <span
          key={`${ripple.x}-${ripple.y}`}
          className="grove-ripple"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            width: ripple.width,
            animationDelay: ripple.delay,
          }}
        />
      ))}
      {GROVE_PETALS.map((petal) => (
        <span
          key={petal.left}
          className="grove-petal grove-petal-low"
          style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.duration }}
        />
      ))}
      {rite ? (
        <>
          {GROVE_GATHER.map((orb) => (
            <span key={`${orb.x}-${orb.y}`} className="grove-gather" style={{ left: `${orb.x}%`, top: `${orb.y}%` }} />
          ))}
          <div className="grove-gleam" />
          <div className="grove-wisp" />
        </>
      ) : null}
    </>
  );
}
