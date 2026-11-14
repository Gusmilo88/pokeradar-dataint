"use client";

import { useEffect, useId, useRef } from "react";
import { CapturePanel } from "@/components/expedition/capture-panel";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import { SoundToggle } from "@/components/expedition/sound-toggle";
import type { DossierEntry, DossierPhase } from "@/components/expedition/use-dossier";
import { prefersReducedMotion } from "@/lib/a11y/motion";
import { HABITAT_LABEL, type ExpeditionZone, type Sighting } from "@/lib/expedition/argentina";
import { captureDifficulty, resistanceLabel } from "@/lib/expedition/capture";
import { playSpeciesCry, stopCry } from "@/lib/expedition/cries";
import type { DiscoveryState } from "@/lib/expedition/discovery";
import { nextWindowHint, timeWindow } from "@/lib/expedition/schedule";
import { speciesLabel, statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";
import "./encounter.css";

export function EncounterModal({
  sighting,
  zone,
  phase,
  entry,
  message,
  state,
  wild,
  now,
  probing,
  onInvestigate,
  onRetry,
  onClose,
  onCaptured,
  onEngage,
  onRelease,
  inTeam,
  teamFull,
  onTeam,
}: {
  sighting: Sighting;
  zone: ExpeditionZone | null;
  phase: DossierPhase;
  entry: DossierEntry | null;
  message: string | null;
  state: DiscoveryState;
  wild: boolean;
  now: Date;
  probing: boolean;
  onInvestigate: () => void;
  onRetry: () => void;
  onClose: () => void;
  onCaptured: (encounterId: string) => void;
  onEngage: () => void;
  onRelease: () => void;
  inTeam: boolean;
  teamFull: boolean;
  onTeam: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cryKey = useRef<string | null>(null);
  const revealed = state !== "undiscovered";
  const name = revealed
    ? (entry?.species.spanishName ?? speciesLabel(sighting.speciesName))
    : "???";
  const windowHint = timeWindow(sighting.id);
  const scheduleNote = windowHint && !wild ? nextWindowHint(windowHint, now) : "";

  useEffect(() => {
    const node = dialogRef.current?.querySelector<HTMLButtonElement>("[data-initial-focus]");
    node?.focus();
  }, [sighting.id, phase]);

  useEffect(() => {
    if (phase !== "ready" || !entry) {
      return;
    }
    const key = `${sighting.id}:${entry.species.id}`;
    if (cryKey.current === key) {
      return;
    }
    cryKey.current = key;
    playSpeciesCry(entry.pokemon.cries, key);
  }, [entry, phase, sighting.id]);

  useEffect(() => {
    return () => stopCry();
  }, [sighting.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (document.querySelector(".capture-stage[data-capture='running']")) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href]")]
        .filter((item) => item.getClientRects().length > 0);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const difficulty = entry
    ? captureDifficulty(entry.species.capture_rate, entry.pokemon.stats.map((stat) => stat.base_stat))
    : null;
  const showCatch = state === "seen" && phase === "ready" && entry && (wild || probing);

  return (
    <div className="encounter-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
      <button type="button" className="encounter-scrim" aria-label="Cerrar encuentro" tabIndex={-1} onClick={onClose} />
      <div className="encounter-sheet">
        <article className="encounter-card" data-motion={prefersReducedMotion() ? "off" : "on"}>
          <header className="encounter-head">
            <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">Exploración</p>
            <h2 id={titleId} className="text-2xl font-semibold tracking-tight">{name}</h2>
            <p className="font-mono text-[11px] tracking-[0.12em] text-quiet uppercase">
              Exp. {String(sighting.expeditionNumber).padStart(2, "0")}
              {revealed && entry ? ` · #${String(entry.species.id).padStart(4, "0")}` : ""}
              {zone ? ` · ${zone.code}` : ""}
            </p>
          </header>
          <div className="encounter-sprite">
            <CreatureSprite
              nationalId={entry?.species.id ?? sighting.nationalId}
              revealed={revealed && phase === "ready"}
              label={revealed ? name : null}
              stillUrl={entry?.pokemon.sprites.blackWhite ?? entry?.pokemon.sprites.front_default ?? null}
              animatedUrl={entry?.pokemon.sprites.blackWhiteAnimated ?? null}
            />
          </div>
          <p className="font-mono text-[11px] tracking-[0.14em] text-amber uppercase">
            {state === "caught" ? "Capturado" : state === "seen" ? "Visto" : "Señal nueva"}
          </p>
          {phase === "loading" ? <p role="status">Consultando PokéAPI.</p> : null}
          {phase === "error" ? (
            <p role="alert">{revealed ? (message ?? "PokéAPI falló. No se inventaron datos.") : "PokéAPI no respondió. La señal sigue sin identificar."}</p>
          ) : null}
          {phase === "ready" && entry ? (
            <>
              <p className="flex flex-wrap gap-1.5">
                {entry.pokemon.types.map((slot) => (
                  <span key={slot.type.name} className="rounded-full border border-phosphor/40 px-2 py-0.5 font-mono text-[11px] uppercase">
                    {typeLabel(slot.type.name)}
                  </span>
                ))}
              </p>
              <ul className="encounter-stats">
                {entry.pokemon.stats.map((stat) => (
                  <li key={stat.stat.name}>
                    <span>{statLabel(stat.stat.name)}</span>
                    <span className="encounter-track">
                      <span style={{ width: `${Math.min(100, (stat.base_stat / STAT_SCALE) * 100)}%` }} />
                    </span>
                    <span>{stat.base_stat}</span>
                  </li>
                ))}
              </ul>
              <p>{difficulty === null ? "La dificultad no está disponible." : `Dificultad ${difficulty} de 10. ${resistanceLabel(difficulty) ?? ""}`}</p>
            </>
          ) : null}
          <p className="text-sm text-quiet">
            {zone ? `${zone.name}. ${HABITAT_LABEL[zone.habitat]}.` : "Sin zona de campo."}
          </p>
          {scheduleNote ? <p className="text-sm text-amber">{scheduleNote}</p> : null}
          {showCatch && entry ? (
            <CapturePanel
              key={sighting.id}
              encounterId={sighting.id}
              captureRate={entry.species.capture_rate}
              baseStats={entry.pokemon.stats.map((stat) => stat.base_stat)}
              state="seen"
              nationalId={entry.species.id}
              stillUrl={entry.pokemon.sprites.blackWhite ?? entry.pokemon.sprites.front_default}
              animatedUrl={entry.pokemon.sprites.blackWhiteAnimated}
              label={name}
              onCaptured={onCaptured}
              onEngage={onEngage}
              onRelease={onRelease}
            />
          ) : null}
          <div className="encounter-actions">
            {!revealed && !probing ? (
              <button type="button" className="action-button" data-initial-focus disabled={!wild} onClick={onInvestigate}>
                Investigar
              </button>
            ) : null}
            {phase === "error" ? (
              <button type="button" className="action-button" data-initial-focus onClick={onRetry}>
                Reintentar
              </button>
            ) : null}
            {phase === "ready" && entry ? (
              <button
                type="button"
                className="action-button"
                onClick={() => playSpeciesCry(entry.pokemon.cries, `${sighting.id}:replay`, true)}
              >
                Grito
              </button>
            ) : null}
            {state === "caught" ? (
              <button type="button" className="action-button" disabled={inTeam || teamFull} onClick={onTeam}>
                {inTeam ? "En el equipo" : teamFull ? "Equipo lleno" : "Al equipo"}
              </button>
            ) : null}
            <SoundToggle />
            <button
              type="button"
              className="action-button"
              data-initial-focus={revealed || probing ? true : undefined}
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
