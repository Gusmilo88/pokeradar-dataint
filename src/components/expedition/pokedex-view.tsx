"use client";

import { useCallback, useEffect, useId, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { CapturePanel } from "@/components/expedition/capture-panel";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import { useDossier } from "@/components/expedition/use-dossier";
import {
  ALBUM_FILTERS,
  albumAccent,
  albumAccentLabel,
  albumCounts,
  albumHitPoints,
  filterAlbum,
  type AlbumFilter,
} from "@/lib/expedition/album";
import { captureDifficulty } from "@/lib/expedition/capture";
import { findEnclaveByEncounter } from "@/lib/expedition/enclaves";
import { explorationHint } from "@/lib/expedition/hints";
import { KANTO_CATALOG, type CatalogEntry } from "@/lib/expedition/kanto";
import { findZone } from "@/lib/expedition/pins";
import { discoveryState, type Progress } from "@/lib/expedition/progress";
import { speciesLabel, statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";
import "./album.css";

const ORDERED = [...KANTO_CATALOG].sort(
  (left, right) => left.expeditionNumber - right.expeditionNumber,
);

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function stateLabel(state: "undiscovered" | "seen" | "caught"): string {
  if (state === "caught") {
    return "Capturado";
  }
  if (state === "seen") {
    return "Visto";
  }
  return "Desconocido";
}

export function PokedexView({
  progress,
  onClose,
  onSeek,
  onCaptured,
  onReset,
}: {
  progress: Progress;
  onClose: () => void;
  onSeek: (encounterId: string) => void;
  onCaptured: (encounterId: string) => void;
  onReset: () => void;
}) {
  const titleId = useId();
  const detailTitleId = useId();
  const searchId = useId();
  const [focusNumber, setFocusNumber] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [filter, setFilter] = useState<AlbumFilter>("all");
  const [query, setQuery] = useState("");
  const focused = ORDERED.find((entry) => entry.expeditionNumber === focusNumber) ?? null;
  const counts = albumCounts(progress);
  const visible = filterAlbum(ORDERED, progress, filter, query);
  const ratio = counts.total === 0 ? 0 : (counts.caught / counts.total) * 100;

  const closeCard = useCallback(() => {
    if (focusNumber === null) {
      return;
    }
    const number = focusNumber;
    setFocusNumber(null);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-album-card="${number}"]`)?.focus();
    });
  }, [focusNumber]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (document.querySelector('.capture-stage[data-capture="running"]')) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (confirmReset) {
        setConfirmReset(false);
        return;
      }
      if (focusNumber !== null) {
        closeCard();
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [closeCard, confirmReset, focusNumber, onClose]);

  useEffect(() => {
    if (focusNumber === null) {
      return;
    }
    document.getElementById(detailTitleId)?.focus();
  }, [detailTitleId, focusNumber]);

  function trapTab(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || event.defaultPrevented) {
      return;
    }
    if (event.target instanceof Element && event.target.closest(".capture-stage")) {
      return;
    }
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
    )]
      .filter((item) => item.getClientRects().length > 0 && !item.closest("[inert]"));
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
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="album-shell absolute inset-0 z-40 flex min-h-0 flex-col overflow-x-hidden"
      onKeyDown={trapTab}
    >
      <header className="album-head" inert={focused ? true : undefined}>
        <svg className="album-ring" viewBox="0 0 36 36" aria-hidden="true">
          <circle className="album-ring-track" cx="18" cy="18" r="15.5" pathLength="100" />
          <circle
            className="album-ring-value"
            cx="18"
            cy="18"
            r="15.5"
            pathLength="100"
            strokeDasharray={`${ratio} 100`}
          />
          <text className="album-ring-label" x="18" y="19.2" textAnchor="middle">
            {counts.percent}%
          </text>
        </svg>
        <div className="min-w-0 flex-1">
          <p className="album-kicker">Colección de campo</p>
          <h2 id={titleId} className="album-title">
            Pokédex
          </h2>
          <p
            className="album-metrics"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={counts.total}
            aria-valuenow={counts.caught}
            aria-valuetext={`${counts.caught} de ${counts.total} capturados, ${counts.percent} por ciento`}
          >
            <span>Total <strong>{counts.total}</strong></span>
            <span>Vistos <strong>{counts.seen}</strong></span>
            <span>Capturados <strong>{counts.caught}</strong></span>
          </p>
        </div>
        <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose} autoFocus>
          Mapa
        </button>
      </header>
      <div className="album-body">
        <div className="album-grid-wrap" inert={focused ? true : undefined}>
          <div className="album-tools">
            <div className="album-filters" role="toolbar" aria-label="Filtrar la colección">
              {ALBUM_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="album-filter"
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="block" htmlFor={searchId}>
              <span className="sr-only">Buscar por nombre o número visible</span>
              <input
                id={searchId}
                className="album-search"
                value={query}
                placeholder="Nombre o número visible"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <p className="sr-only" aria-live="polite">
            {visible.length} cartas
          </p>
          {visible.length === 0 ? (
            <p className="album-empty">Ninguna carta coincide con este criterio.</p>
          ) : (
            <ul className="album-grid" data-album="grid">
              {visible.map((entry) => {
                const state = discoveryState(progress, entry.encounterId);
                const revealed = state !== "undiscovered";
                const accent = revealed ? albumAccent(entry) : null;
                const zone = entry.zoneId ? (findZone(entry.zoneId) ?? null) : null;
                const name = revealed ? speciesLabel(entry.speciesName) : "???";
                return (
                  <li key={entry.encounterId}>
                    <button
                      type="button"
                      className="album-card"
                      data-album-card={entry.expeditionNumber}
                      data-state={state === "undiscovered" ? "unknown" : state}
                      data-accent={accent ?? undefined}
                      data-holo={accent ? "ready" : undefined}
                      aria-pressed={focusNumber === entry.expeditionNumber}
                      aria-label={
                        revealed
                          ? `${name}. Expedición ${pad(entry.expeditionNumber)}. ${stateLabel(state)}.`
                          : `Expedición ${pad(entry.expeditionNumber)}. Identidad desconocida.`
                      }
                      onClick={() => setFocusNumber(entry.expeditionNumber)}
                    >
                      <span className="album-index">{pad(entry.expeditionNumber)}</span>
                      {accent ? <span className="album-theme">{albumAccentLabel(entry)}</span> : null}
                      <span className="album-sprite">
                        <CreatureSprite nationalId={entry.nationalId} revealed={revealed} label={revealed ? name : null} />
                      </span>
                      <span className="album-name">{name}</span>
                      <span className="album-state">
                        {state === "caught" ? "En la colección" : state === "seen" ? "Puede capturarse" : "Desconocido"}
                      </span>
                      {revealed ? null : <span className="album-hint">{explorationHint(entry, zone)}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="album-reset">
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
      </div>
      {focused ? (
        <DexCard
          entry={focused}
          state={discoveryState(progress, focused.encounterId)}
          titleId={detailTitleId}
          onBack={closeCard}
          onSeek={onSeek}
          onCaptured={onCaptured}
        />
      ) : null}
    </div>
  );
}

function DexCard({
  entry,
  state,
  titleId,
  onBack,
  onSeek,
  onCaptured,
}: {
  entry: CatalogEntry;
  state: "undiscovered" | "seen" | "caught";
  titleId: string;
  onBack: () => void;
  onSeek: (encounterId: string) => void;
  onCaptured: (encounterId: string) => void;
}) {
  const revealed = state !== "undiscovered";
  const zone = entry.zoneId ? (findZone(entry.zoneId) ?? null) : null;
  const enclave = findEnclaveByEncounter(entry.encounterId);
  const dossier = useDossier(revealed ? entry.speciesName : null);
  const accent = revealed ? albumAccent(entry) : null;
  const ready = dossier.entry;
  const name = revealed ? (ready?.species.spanishName ?? speciesLabel(entry.speciesName)) : "???";
  const hp = ready
    ? albumHitPoints(ready.pokemon.stats.map((stat) => ({ name: stat.stat.name, value: stat.base_stat })))
    : null;
  const difficulty = ready
    ? captureDifficulty(
        ready.species.capture_rate,
        ready.pokemon.stats.map((stat) => stat.base_stat),
      )
    : null;
  const place = zone
    ? `${zone.name}. ${zone.region}.`
    : enclave
      ? `${enclave.place}. ${enclave.region}.`
      : null;
  const status =
    state === "caught" ? "En la colección" : state === "seen" ? "Visto" : "Desconocido";

  return (
    <div className="album-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="album-scrim" aria-label="Cerrar carta" tabIndex={-1} onClick={onBack} />
      <article
        className="tcg-card"
        data-state={state === "undiscovered" ? "unknown" : state}
        data-accent={accent ?? undefined}
        data-holo={accent ? "ready" : undefined}
        data-card="open"
        aria-busy={revealed && dossier.phase === "loading" ? true : undefined}
      >
        <header className="tcg-top">
          <div className="min-w-0">
            <p className="tcg-kicker">Exp. {pad(entry.expeditionNumber)}</p>
            <h3 id={titleId} tabIndex={0} className="tcg-name">
              {name}
            </h3>
          </div>
          {revealed ? (
            <p className="tcg-hp">
              <span>PS</span>
              <strong>{hp === null ? "—" : hp}</strong>
            </p>
          ) : null}
        </header>
        <div className="tcg-art">
          <div className="tcg-art-sprite">
            <CreatureSprite
              nationalId={entry.nationalId}
              revealed={revealed}
              label={revealed ? name : null}
              stillUrl={ready?.pokemon.sprites.blackWhite}
              animatedUrl={ready?.pokemon.sprites.blackWhiteAnimated}
            />
          </div>
          {accent ? <p className="tcg-rarity">{albumAccentLabel(entry)}</p> : null}
          {state === "caught" ? <p className="tcg-stamp">En la colección</p> : null}
        </div>
        {revealed && ready ? (
          <p className="album-types tcg-types">
            {ready.pokemon.types.map((slot) => (
              <span key={slot.type.name} className="album-type" data-type={slot.type.name}>
                {typeLabel(slot.type.name)}
              </span>
            ))}
          </p>
        ) : null}
        <div className="tcg-box">
          {revealed && ready ? (
            <>
              {ready.species.varieties.length > 1 ? (
                <p className="tcg-note">Variedad por defecto.</p>
              ) : null}
              <ul className="album-stats">
                {ready.pokemon.stats.map((stat) => (
                  <li key={stat.stat.name} className="album-stat">
                    <span>{statLabel(stat.stat.name)}</span>
                    <span className="album-stat-track">
                      <span
                        className="album-stat-fill block"
                        style={{ width: `${Math.min(100, (stat.base_stat / STAT_SCALE) * 100)}%` }}
                      />
                    </span>
                    <span className="text-right text-ink">{stat.base_stat}</span>
                  </li>
                ))}
              </ul>
              <p className="tcg-note">
                {difficulty === null ? "La dificultad no está disponible." : `Dificultad ${difficulty} de 10.`}
              </p>
              <p className="tcg-note">{place ?? "Sin zona de campo."}</p>
            </>
          ) : revealed ? (
            <p role={dossier.phase === "error" ? "alert" : "status"}>
              {dossier.phase === "error"
                ? (dossier.message ?? "La ficha no llegó. Sigue registrada como vista.")
                : "Consultando tipos y estadísticas."}
            </p>
          ) : (
            <>
              <p className="tcg-sealed">Carta sellada</p>
              <p>{explorationHint(entry, zone)}</p>
              <p>Nombre, tipos y estadísticas bloqueados.</p>
            </>
          )}
        </div>
        <footer className="tcg-foot">
          <p>{revealed ? `#${String(entry.nationalId).padStart(4, "0")}` : "???"}</p>
          <p className="album-state">{status}</p>
        </footer>
        {dossier.phase === "error" ? (
          <button type="button" className="action-button tcg-action" onClick={dossier.retry}>
            Reintentar
          </button>
        ) : null}
        {state === "seen" && ready ? (
          <CapturePanel
            key={entry.encounterId}
            encounterId={entry.encounterId}
            captureRate={ready.species.capture_rate}
            baseStats={ready.pokemon.stats.map((stat) => stat.base_stat)}
            state="seen"
            nationalId={ready.species.id}
            stillUrl={ready.pokemon.sprites.blackWhite ?? ready.pokemon.sprites.front_default}
            animatedUrl={ready.pokemon.sprites.blackWhiteAnimated}
            label={name}
            onCaptured={onCaptured}
          />
        ) : null}
        <div className="tcg-actions">
          {entry.role === "field" ? (
            <button type="button" className="action-button tcg-action" onClick={() => onSeek(entry.encounterId)}>
              {revealed ? "Ver en el mapa" : "Buscar en el mapa"}
            </button>
          ) : revealed && enclave ? (
            <button type="button" className="action-button tcg-action" onClick={() => onSeek(entry.encounterId)}>
              Ver en el mapa
            </button>
          ) : entry.role === "reserved" ? (
            <p className="tcg-note">Sin enclave de campo.</p>
          ) : null}
          <button type="button" className="action-button tcg-action tcg-close" onClick={onBack}>
            Cerrar
          </button>
        </div>
      </article>
    </div>
  );
}
