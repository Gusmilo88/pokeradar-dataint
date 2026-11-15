"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { CapturePanel } from "@/components/expedition/capture-panel";
import { AlbumSortMenu } from "@/components/expedition/album-sort-menu";
import { TrainerProfile } from "@/components/expedition/trainer-profile";
import { TrainerXpReadout } from "@/components/expedition/trainer-xp-readout";
import { useFinishes } from "@/components/expedition/use-finishes";
import { CreatureSprite } from "@/components/expedition/creature-sprite";
import { useDossier } from "@/components/expedition/use-dossier";
import {
  ALBUM_FILTERS,
  albumAccent,
  albumAccentLabel,
  albumCounts,
  albumArtwork,
  albumHitPoints,
  type AlbumFilter,
} from "@/lib/expedition/album";
import { captureDifficulty } from "@/lib/expedition/capture";
import { playSpeciesCry } from "@/lib/expedition/cries";
import {
  GENERATION_LABEL,
  queryAlbum,
  revealedTypeNames,
  type SortDirection,
  type SortKey,
  type TypeMode,
} from "@/lib/expedition/dex-query";
import { appearanceHint, isFieldWild, nextWindowHint, timeWindow } from "@/lib/expedition/schedule";
import { TEAM_LIMIT } from "@/lib/expedition/team";
import { useRevealedFacts } from "@/components/expedition/use-revealed-facts";
import type { ExpeditionDemoController } from "@/components/expedition/use-expedition-demo";
import { findEnclaveByEncounter } from "@/lib/expedition/enclaves";
import { explorationHint } from "@/lib/expedition/hints";
import { KANTO_CATALOG, type CatalogEntry } from "@/lib/expedition/kanto";
import { findZone } from "@/lib/expedition/pins";
import { discoveryState, type Progress } from "@/lib/expedition/progress";
import { assessExpedition } from "@/lib/expedition/trainer-xp";
import type { CardFinishId } from "@/lib/expedition/trainer-rewards";
import { speciesLabel, statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";
import { blackWhiteStill } from "@/lib/pokeapi/sprites";
import "./album.css";
import "./trainer-profile.css";

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
  seen,
  badgesEarned,
  badgesTotal,
  onClose,
  onSeek,
  onCaptured,
  onReset,
  now,
  teamMembers,
  onTeam,
  demo,
}: {
  progress: Progress;
  seen: number;
  badgesEarned: number;
  badgesTotal: number;
  onClose: () => void;
  onSeek: (encounterId: string) => void;
  onCaptured: (encounterId: string) => void;
  onReset: () => void;
  now: Date;
  teamMembers: readonly string[];
  onTeam: (encounterId: string) => void;
  demo: ExpeditionDemoController;
}) {
  const titleId = useId();
  const detailTitleId = useId();
  const searchId = useId();
  const [focusNumber, setFocusNumber] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [filter, setFilter] = useState<AlbumFilter>("all");
  const [query, setQuery] = useState("");
  const [chosenTypes, setChosenTypes] = useState<string[]>([]);
  const [typeMode, setTypeMode] = useState<TypeMode>("any");
  const [sortKey, setSortKey] = useState<SortKey>("expedition");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const realReport = assessExpedition(progress.caught);
  const realLevel = realReport.complete ? realReport.progress.level : 1;
  const finishes = useFinishes(realLevel);
  const view = demo.active ? demo.progress : progress;
  const facts = useRevealedFacts(view);
  const trainer = assessExpedition(view.caught);
  const typeChoices = revealedTypeNames(facts);
  const focused = ORDERED.find((entry) => entry.expeditionNumber === focusNumber) ?? null;
  const equipped = demo.active ? demo.equipped : finishes.equipped;
  const onEquip = demo.active ? demo.equip : finishes.equip;
  const counts = albumCounts(view);
  const visible = queryAlbum(
    ORDERED,
    view,
    filter,
    query,
    chosenTypes,
    typeMode,
    sortKey,
    sortDirection,
    facts,
  );
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
      if (document.querySelector("[data-badge-case]")) {
        return;
      }
      if (document.querySelector("[data-badge-ceremony]")) {
        return;
      }
      if (document.querySelector("[data-level-ceremony]")) {
        return;
      }
      if (document.querySelector(".album-sort-list")) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (profileOpen) {
        setProfileOpen(false);
        return;
      }
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
  }, [closeCard, confirmReset, focusNumber, onClose, profileOpen]);

  useEffect(() => {
    if (focusNumber === null) {
      return;
    }
    document.querySelector<HTMLButtonElement>(".tcg-front .tcg-flip")?.focus();
  }, [focusNumber]);

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
      data-card={focused ? "open" : undefined}
      data-expedition-demo={demo.active ? "on" : "off"}
      onKeyDown={trapTab}
    >
      <header className="album-head" inert={focused || profileOpen ? true : undefined}>
        <div className="album-ring-wrap">
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
          </svg>
          <p className="album-ring-label">
            <span className="album-ring-figure">
              <span>{counts.percent}</span>
              <span className="album-ring-unit">%</span>
            </span>
          </p>
        </div>
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
          <TrainerXpReadout caught={view.caught} />
          {demo.active ? (
            <p className="text-sm text-quiet" role="status">
              <strong>MODO DEMOSTRACIÓN.</strong> Esta prueba no modifica tu partida.
            </p>
          ) : null}
        </div>
        <div className="album-head-actions">
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={() => setProfileOpen(true)}>
            Perfil
          </button>
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose} autoFocus>
            Mapa
          </button>
        </div>
      </header>
      <div className="album-body">
        <div className="album-grid-wrap" inert={focused || profileOpen ? true : undefined}>
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
            <p className="album-generation">{GENERATION_LABEL}</p>
            <div className="album-sort">
              <AlbumSortMenu value={sortKey} onChange={setSortKey} />
              <button
                type="button"
                className="album-filter"
                aria-pressed={sortDirection === "desc"}
                onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
              >
                {sortDirection === "asc" ? "Ascendente" : "Descendente"}
              </button>
            </div>
            {typeChoices.length > 0 ? (
              <div className="album-filters" role="toolbar" aria-label="Filtrar por tipo revelado">
                {typeChoices.map((type) => {
                  const pressed = chosenTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      className="album-filter"
                      aria-pressed={pressed}
                      onClick={() => {
                        setChosenTypes((current) =>
                          current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
                        );
                      }}
                    >
                      {typeLabel(type)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="album-clear"
                  onClick={() => {
                    setFilter("all");
                    setChosenTypes([]);
                    setTypeMode("any");
                    setQuery("");
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : null}
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
                const state = discoveryState(view, entry.encounterId);
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
                          ? `${name}. Registro ${pad(entry.expeditionNumber)}. ${stateLabel(state)}.`
                          : `Registro ${pad(entry.expeditionNumber)}. Identidad desconocida.`
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
            {demo.active ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="action-button inline-flex items-center justify-center"
                  onClick={demo.complete}
                >
                  Completar las 56 capturas
                </button>
                <button
                  type="button"
                  className="action-button inline-flex items-center justify-center opacity-80"
                  onClick={() => {
                    demo.reset();
                    setFocusNumber(null);
                  }}
                >
                  Reiniciar demostración
                </button>
                <button
                  type="button"
                  className="action-button inline-flex items-center justify-center opacity-70"
                  onClick={() => {
                    demo.exit();
                    setFocusNumber(null);
                    setProfileOpen(false);
                  }}
                >
                  Salir de demostración
                </button>
              </div>
            ) : confirmReset ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-quiet">Se borran las vistas, las capturas y los acabados de esta expedición.</p>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="action-button inline-flex items-center justify-center opacity-80"
                  onClick={() => setConfirmReset(true)}
                >
                  Reiniciar expedición
                </button>
                <button
                  type="button"
                  className="action-button inline-flex items-center justify-center opacity-60"
                  onClick={demo.enter}
                >
                  Probar expedición completa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {focused ? (
        <DexCard
          entry={focused}
          state={discoveryState(view, focused.encounterId)}
          titleId={detailTitleId}
          onBack={closeCard}
          onSeek={onSeek}
          onCaptured={demo.active ? () => undefined : onCaptured}
          now={now}
          inTeam={demo.active ? false : teamMembers.includes(focused.encounterId)}
          teamFull={teamMembers.length >= TEAM_LIMIT}
          onTeam={demo.active ? () => undefined : () => onTeam(focused.encounterId)}
          finish={equipped}
        />
      ) : null}
      {profileOpen ? (
        <TrainerProfile
          progress={trainer.complete ? trainer.progress : null}
          seen={demo.active ? view.seen.size : seen}
          caught={view.caught.size}
          badgesEarned={badgesEarned}
          badgesTotal={badgesTotal}
          sample={ORDERED.find((entry) => view.caught.has(entry.encounterId)) ?? null}
          equipped={equipped}
          onEquip={onEquip}
          demonstration={demo.active}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
    </div>
  );
}

function tiltCard(event: ReactPointerEvent<HTMLElement>, active: boolean) {
  const node = event.currentTarget;
  if (!active || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const rect = node.getBoundingClientRect();
  const px = rect.width === 0 ? 0.5 : (event.clientX - rect.left) / rect.width;
  const py = rect.height === 0 ? 0.5 : (event.clientY - rect.top) / rect.height;
  node.style.setProperty("--tilt-x", `${((0.5 - py) * 6).toFixed(2)}deg`);
  node.style.setProperty("--tilt-y", `${((px - 0.5) * 7).toFixed(2)}deg`);
  node.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
  node.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
}

function resetTilt(event: ReactPointerEvent<HTMLElement>) {
  const node = event.currentTarget;
  node.style.removeProperty("--tilt-x");
  node.style.removeProperty("--tilt-y");
  node.style.removeProperty("--mx");
  node.style.removeProperty("--my");
}

function CardPrint({
  revealed,
  artwork,
  nationalId,
  label,
}: {
  revealed: boolean;
  artwork: string | null;
  nationalId: number;
  label: string | null;
}) {
  const fallback = blackWhiteStill(nationalId);
  const preferred = revealed ? (artwork ?? fallback) : fallback;
  const [generation, setGeneration] = useState(preferred);
  const [src, setSrc] = useState(preferred);
  const [failed, setFailed] = useState(false);
  if (generation !== preferred) {
    setGeneration(preferred);
    setSrc(preferred);
    setFailed(false);
  }
  if (failed) {
    return <p className="tcg-missing">Sin señal</p>;
  }
  return (
    // El artwork sale de la ficha de PokéAPI. next/image pediría un remotePattern.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={revealed && label ? `Ilustración de ${label}` : ""}
      data-print={revealed && artwork && src === artwork ? "art" : "sprite"}
      className={revealed ? "tcg-print" : "tcg-print tcg-silhouette"}
      draggable={false}
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

function TurnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16.5 6.5A6.5 6.5 0 0 0 6.2 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7.5 17.5A6.5 6.5 0 0 0 17.8 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M6.2 5.2v3.8h3.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.8 18.8v-3.8h-3.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 9.4h2.8L11.2 6v12l-3.9-3.4H4.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14.2 9.2a3.1 3.1 0 0 1 0 5.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.4 7a5.6 5.6 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MapMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s5.5-4.8 5.5-9.2a5.5 5.5 0 1 0-11 0c0 4.4 5.5 9.2 5.5 9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="11.2" r="1.8" fill="currentColor" />
    </svg>
  );
}

function holdsCard(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("button, a, input, textarea, select, label, [data-no-flip]"));
}

function scrollMark(target: EventTarget | null): number {
  if (!(target instanceof Element)) {
    return 0;
  }
  const face = target.closest(".tcg-face");
  const sheet = target.closest(".album-sheet");
  return (face instanceof HTMLElement ? face.scrollTop : 0) + (sheet instanceof HTMLElement ? sheet.scrollTop : 0);
}

function DexCard({
  entry,
  state,
  titleId,
  onBack,
  onSeek,
  onCaptured,
  now,
  inTeam,
  teamFull,
  onTeam,
  finish,
}: {
  entry: CatalogEntry;
  state: "undiscovered" | "seen" | "caught";
  titleId: string;
  onBack: () => void;
  onSeek: (encounterId: string) => void;
  onCaptured: (encounterId: string) => void;
  now: Date;
  inTeam: boolean;
  teamFull: boolean;
  onTeam: () => void;
  finish: CardFinishId;
}) {
  const shown = state === "caught" ? finish : null;
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
  const artwork = albumArtwork(
    ready
      ? {
          officialArtwork: ready.pokemon.sprites.officialArtwork,
          blackWhite: ready.pokemon.sprites.blackWhite,
          front_default: ready.pokemon.sprites.front_default,
        }
      : null,
    revealed,
  );
  const primaryType = accent ? null : (ready?.pokemon.types[0]?.type.name ?? null);
  const [engaged, setEngaged] = useState<string | null>(null);
  const [face, setFace] = useState<"front" | "back">("front");
  const [faceFor, setFaceFor] = useState(entry.encounterId);
  if (faceFor !== entry.encounterId) {
    setFaceFor(entry.encounterId);
    setFace("front");
  }

  useEffect(() => {
    document
      .querySelector<HTMLButtonElement>(face === "back" ? ".tcg-back .tcg-flip" : ".tcg-front .tcg-flip")
      ?.focus();
  }, [face, entry.encounterId]);

  useEffect(() => {
    if (!revealed || !ready) {
      return;
    }
    playSpeciesCry(ready.pokemon.cries, `dex:${entry.encounterId}`);
  }, [entry.encounterId, ready, revealed]);

  function flip() {
    setFace((current) => (current === "front" ? "back" : "front"));
  }

  const press = useRef<{ x: number; y: number; scroll: number; blocked: boolean } | null>(null);

  function onCardPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    press.current = {
      x: event.clientX,
      y: event.clientY,
      scroll: scrollMark(event.target),
      blocked: holdsCard(event.target),
    };
  }

  function onCardPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const start = press.current;
    press.current = null;
    if (!start || start.blocked || event.button !== 0 || holdsCard(event.target)) {
      return;
    }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) {
      return;
    }
    if (scrollMark(event.target) !== start.scroll) {
      return;
    }
    if ((window.getSelection()?.toString() ?? "").length > 0) {
      return;
    }
    flip();
  }

  const schedule = timeWindow(entry.encounterId);
  const wild = !schedule || isFieldWild(entry.encounterId, now);
  const scheduleNote = !schedule
    ? null
    : state === "undiscovered"
      ? appearanceHint(schedule)
      : wild
        ? null
        : nextWindowHint(schedule, now);
  const catchAllowed = state === "seen" && ready && (wild || engaged === entry.encounterId);
  const canSeek = !(schedule && !wild) && (entry.role === "field" || Boolean(revealed && enclave));
  const seekLabel = revealed ? "Ver en el mapa" : "Buscar en el mapa";
  const teamLabel = inTeam ? "En el equipo" : teamFull ? "Equipo lleno" : "Agregar al equipo";

  function turnControl(pressed: boolean) {
    return (
      <button
        type="button"
        className="tcg-icon tcg-flip"
        aria-pressed={pressed}
        aria-label="Girar carta"
        title="Girar carta"
        onClick={(event) => {
          event.stopPropagation();
          flip();
        }}
      >
        <TurnIcon />
      </button>
    );
  }

  return (
    <div className="album-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <h3 id={titleId} className="sr-only">
        {name}. {status}.
      </h3>
      <button type="button" className="album-scrim" aria-label="Cerrar carta" tabIndex={-1} onClick={onBack} />
      <div
        className="album-sheet"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onBack();
          }
        }}
      >
      <article
        className="tcg-card"
        data-state={state === "undiscovered" ? "unknown" : state}
        data-accent={accent ?? undefined}
        data-holo={accent ? "ready" : undefined}
        data-type={primaryType ?? undefined}
        data-face={face}
        data-finish={shown ?? undefined}
        data-card="open"
        aria-busy={revealed && dossier.phase === "loading" ? true : undefined}
        onPointerMove={(event) => tiltCard(event, accent !== null)}
        onPointerLeave={resetTilt}
      >
        <div className="tcg-rotor">
          <div className="tcg-face tcg-front" inert={face === "back" ? true : undefined}>
            <span className="card-skin" aria-hidden="true"><span className="card-sheen" /></span>
            <div className="tcg-frame" onPointerDown={onCardPointerDown} onPointerUp={onCardPointerUp}>
              <header className="tcg-top">
                <div className="min-w-0">
                  <p className="tcg-kicker">{revealed ? `#${String(entry.nationalId).padStart(4, "0")}` : "???"}</p>
                  <p className="tcg-name">{name}</p>
                </div>
                {revealed ? (
                  <p className="tcg-hp">
                    <span>PS</span>
                    <strong>{hp === null ? "—" : hp}</strong>
                  </p>
                ) : null}
              </header>
              {revealed && ready ? (
                <p className="album-types tcg-types">
                  {ready.pokemon.types.map((slot) => (
                    <span key={slot.type.name} className="album-type" data-type={slot.type.name}>
                      {typeLabel(slot.type.name)}
                    </span>
                  ))}
                </p>
              ) : null}
              <div className="tcg-art">
                <CardPrint revealed={revealed} artwork={artwork} nationalId={entry.nationalId} label={revealed ? name : null} />
                {accent ? <p className="tcg-rarity">{albumAccentLabel(entry)}</p> : null}
                {state === "caught" ? <p className="tcg-stamp">En la colección</p> : null}
              </div>
              <p className="tcg-imprint">Registro {pad(entry.expeditionNumber)}</p>
              <p className="album-state">{status}</p>
              {revealed && !ready ? (
                <p className="tcg-note" role={dossier.phase === "error" ? "alert" : "status"}>
                  {dossier.phase === "error"
                    ? (dossier.message ?? "La ficha no llegó. Sigue registrada como vista.")
                    : "Consultando la ilustración."}
                </p>
              ) : null}
              {!revealed ? (
                <p className="tcg-note">{schedule ? scheduleNote : explorationHint(entry, zone)}</p>
              ) : null}
              {revealed && scheduleNote ? <p className="tcg-note">{scheduleNote}</p> : null}
              <div className="tcg-edge">
                {turnControl(false)}
              </div>
            </div>
            <span className="tcg-foil" aria-hidden="true" />
          </div>
          <div className="tcg-face tcg-back" inert={face === "front" ? true : undefined}>
            <span className="card-skin" aria-hidden="true"><span className="card-sheen" /></span>
            <div className="tcg-frame" onPointerDown={onCardPointerDown} onPointerUp={onCardPointerUp}>
              <header className="tcg-top">
                <div className="min-w-0">
                  <p className="tcg-kicker">Ficha de expedición</p>
                  <p className="tcg-name">{name}</p>
                </div>
                <p className="album-state">{status}</p>
              </header>
              {revealed && ready ? (
                <>
                  {ready.species.varieties.length > 1 ? <p className="tcg-note">Variedad por defecto.</p> : null}
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
                <p className="tcg-note" role={dossier.phase === "error" ? "alert" : "status"}>
                  {dossier.phase === "error"
                    ? (dossier.message ?? "La ficha no llegó. Sigue registrada como vista.")
                    : "Consultando tipos y estadísticas."}
                </p>
              ) : (
                <>
                  <p className="tcg-sealed">Carta sellada</p>
                  <p className="tcg-note">{schedule ? scheduleNote : explorationHint(entry, zone)}</p>
                  <p className="tcg-note">Nombre, tipos y estadísticas bloqueados.</p>
                </>
              )}
              {!(schedule && !wild) && entry.role === "reserved" && !(revealed && enclave) ? (
                <p className="tcg-note">Sin enclave de campo.</p>
              ) : null}
              {dossier.phase === "error" ? (
                <button type="button" className="tcg-team" onClick={dossier.retry}>
                  Reintentar
                </button>
              ) : null}
              {catchAllowed && ready ? (
                <div data-no-flip>
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
                    onEngage={() => setEngaged(entry.encounterId)}
                    onRelease={() => setEngaged(null)}
                  />
                </div>
              ) : null}
              {state === "caught" && ready ? (
                <button
                  type="button"
                  className="tcg-team"
                  aria-pressed={inTeam}
                  disabled={!inTeam && teamFull}
                  title={teamLabel}
                  onClick={() => {
                    if (!inTeam && !teamFull) {
                      onTeam();
                    }
                  }}
                >
                  {teamLabel}
                </button>
              ) : null}
              <div className="tcg-edge">
                {ready ? (
                  <button
                    type="button"
                    className="tcg-icon tcg-cry"
                    aria-label="Reproducir grito"
                    title="Reproducir grito"
                    onClick={(event) => {
                      event.stopPropagation();
                      playSpeciesCry(ready.pokemon.cries, `dex:${entry.encounterId}:cry`, true);
                    }}
                  >
                    <CryIcon />
                  </button>
                ) : null}
                {turnControl(true)}
                {canSeek ? (
                  <button
                    type="button"
                    className="tcg-icon tcg-seek"
                    aria-label={seekLabel}
                    title={seekLabel}
                    onClick={() => onSeek(entry.encounterId)}
                  >
                    <MapMark />
                  </button>
                ) : null}
              </div>
            </div>
            <span className="tcg-foil" aria-hidden="true" />
          </div>
        </div>
      </article>
      </div>
    </div>
  );
}
