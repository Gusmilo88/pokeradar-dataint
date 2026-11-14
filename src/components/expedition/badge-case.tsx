"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { BADGE_CASE_ASSET } from "@/lib/badges/badges-data";
import type { BadgeSummary, BadgeView } from "@/lib/badges/evaluate";
import "./badges.css";

function presentationLabel(state: BadgeView["presentation"]): string {
  if (state === "fresh") {
    return "Recién obtenida";
  }
  if (state === "earned") {
    return "Conseguida";
  }
  return "Bloqueada";
}

function joinList(items: readonly string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  const head = items.slice(0, -1).join(", ");
  const last = items[items.length - 1] ?? "";
  return `${head} y ${last}`;
}

function formatUnlock(badge: BadgeView): string {
  if (!badge.unlocked) {
    return "Pendiente";
  }
  if (!badge.unlockedAt) {
    return "Sin registrar";
  }
  const date = new Date(badge.unlockedAt);
  if (Number.isNaN(date.getTime())) {
    return "Sin registrar";
  }
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(date);
}

function trapTab(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (event.key !== "Tab" || event.defaultPrevented) {
    return;
  }
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")]
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
}

function CaseArt() {
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  if (gone) {
    return null;
  }
  return (
    // El WebP es opcional. Si no está, la vitrina sigue en CSS.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BADGE_CASE_ASSET}
      alt=""
      className="badge-case-art"
      data-ready={ready ? "true" : "false"}
      decoding="async"
      onLoad={() => setReady(true)}
      onError={() => setGone(true)}
    />
  );
}

function MedalBlank() {
  const rawId = useId().replace(/:/g, "");
  const metal = `${rawId}-metal`;
  const gem = `${rawId}-gem`;
  return (
    <svg className="badge-blank" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="38%" stopColor="var(--badge-metal)" />
          <stop offset="100%" stopColor="#241c16" />
        </linearGradient>
        <radialGradient id={gem} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="42%" stopColor="var(--badge-gem)" />
          <stop offset="100%" stopColor="#1a120e" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill={`url(#${metal})`} />
      <circle cx="60" cy="60" r="44" fill="#140e0c" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.28)" />
      <polygon points="60,26 86,60 60,94 34,60" fill={`url(#${gem})`} />
      <polygon points="60,34 78,60 60,86 42,60" fill="none" stroke="rgba(255,255,255,0.4)" />
    </svg>
  );
}

function MedalArt({ badge }: { badge: BadgeView }) {
  const [failed, setFailed] = useState(false);
  const shine = badge.presentation === "fresh" ? "armed" : "idle";
  return (
    <span className="badge-face" data-state={badge.presentation} data-shine={shine} data-asset={badge.assetPath}>
      {badge.unlocked && !failed ? (
        // El archivo lo agrega el proyecto. Hasta entonces queda el engaste.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badge.assetPath}
          alt=""
          width={256}
          height={256}
          draggable={false}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <MedalBlank />
      )}
    </span>
  );
}

function MedalOrbit({ badge }: { badge: BadgeView }) {
  const style = {
    "--badge-metal": badge.palette.metal,
    "--badge-gem": badge.palette.gem,
    "--badge-glow": badge.palette.glow,
    "--badge-progress": String(badge.progressPercent),
  } as CSSProperties;
  return (
    <span className="badge-orbit" style={style}>
      <span className="badge-bezel">
        <MedalArt badge={badge} />
      </span>
    </span>
  );
}

export function BadgeCase({
  badges,
  summary,
  onClose,
  onAcknowledge,
}: {
  badges: readonly BadgeView[];
  summary: BadgeSummary;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
}) {
  const titleId = useId();
  const detailTitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = badges.find((badge) => badge.id === selectedId) ?? null;

  const closeDetail = useCallback((id: string) => {
    const badge = badges.find((item) => item.id === id);
    if (badge?.presentation === "fresh") {
      onAcknowledge(id);
    }
    setSelectedId(null);
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(`[data-badge-slot="${CSS.escape(id)}"]`)?.focus();
    }, 0);
  }, [badges, onAcknowledge]);

  useEffect(() => {
    if (selectedId) {
      detailRef.current?.focus();
      return;
    }
    if (!opened.current) {
      opened.current = true;
      panelRef.current?.focus();
    }
  }, [selectedId]);

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
      if (selectedId) {
        closeDetail(selectedId);
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [closeDetail, onClose, selectedId]);

  return (
    <div className="badge-case" data-badge-case="">
      <CaseArt />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={selected ? undefined : true}
        aria-labelledby={titleId}
        tabIndex={-1}
        className="badge-sheet"
        inert={selected ? true : undefined}
        onKeyDown={trapTab}
      >
        <header className="badge-top">
          <div>
            <p className="badge-kicker">Liga de Kanto</p>
            <h2 id={titleId} className="badge-title">
              Vitrina de medallas
            </h2>
          </div>
          <div className="badge-summary">
            <p
              className="badge-count"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={summary.total}
              aria-valuenow={summary.earned}
              aria-valuetext={`${summary.earned} de ${summary.total} medallas, ${summary.percent} por ciento`}
            >
              <strong>
                {summary.earned}/{summary.total}
              </strong>{" "}
              medallas · {summary.percent}%
            </p>
            <div className="badge-bar" aria-hidden="true">
              <span style={{ width: `${summary.percent}%` }} />
            </div>
          </div>
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <div className="badge-scroll">
          <div className="badge-tray">
            <ul className="badge-grid">
              {badges.map((badge) => {
                const style = {
                  "--badge-metal": badge.palette.metal,
                  "--badge-gem": badge.palette.gem,
                  "--badge-glow": badge.palette.glow,
                  "--badge-progress": String(badge.progressPercent),
                } as CSSProperties;
                return (
                  <li key={badge.id}>
                    <button
                      type="button"
                      className={`badge-slot ${badge.visualClass}`}
                      data-badge-slot={badge.id}
                      data-state={badge.presentation}
                      data-rarity={badge.rarity}
                      style={style}
                      aria-label={`${badge.name}, ${presentationLabel(badge.presentation)}, ${badge.captured} de ${badge.total}`}
                      onClick={() => setSelectedId(badge.id)}
                    >
                      <span className="badge-orbit">
                        <span className="badge-bezel">
                          <MedalArt badge={badge} />
                        </span>
                      </span>
                      <span className="badge-name">{badge.name}</span>
                      <span className="badge-progress">
                        {badge.captured}/{badge.total}
                      </span>
                      <span className="badge-state">{presentationLabel(badge.presentation)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      {selected ? (
        <div
          className="badge-detail-back"
          onClick={() => closeDetail(selected.id)}
        >
          <div
            ref={detailRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={detailTitleId}
            tabIndex={-1}
            className={`badge-detail ${selected.visualClass}`}
            data-state={selected.presentation}
            style={
              {
                "--badge-metal": selected.palette.metal,
                "--badge-gem": selected.palette.gem,
                "--badge-glow": selected.palette.glow,
                "--badge-progress": String(selected.progressPercent),
              } as CSSProperties
            }
            onClick={(event) => event.stopPropagation()}
            onKeyDown={trapTab}
          >
            <div className="badge-detail-medal">
              <MedalOrbit badge={selected} />
            </div>
            <div className="badge-detail-copy">
              <p className="badge-kicker">{presentationLabel(selected.presentation)}</p>
              <h3 id={detailTitleId}>{selected.name}</h3>
              <p className="badge-lead">{selected.description}</p>
              <dl className="badge-facts">
                <dt>Condición</dt>
                <dd>{selected.condition}</dd>
                <dt>Progreso</dt>
                <dd>
                  {selected.captured} de {selected.total} · {selected.progressPercent}%
                </dd>
                <dt>Estado</dt>
                <dd>{presentationLabel(selected.presentation)}</dd>
                <dt>Fecha del logro</dt>
                <dd>{formatUnlock(selected)}</dd>
              </dl>
              <h4 className="badge-species-title">Pokémon del conjunto</h4>
              <ul className="badge-species">
                {selected.species.map((species) => (
                  <li key={species.encounterId} data-caught={species.captured ? "true" : "false"}>
                    {species.label}
                  </li>
                ))}
              </ul>
              {!selected.unlocked && selected.missing.length > 0 ? (
                <p className="badge-missing">Falta: {joinList(selected.missing.map((item) => item.label))}.</p>
              ) : null}
              <p className="badge-path">Lugar del arte · {selected.assetPath}</p>
              <div className="badge-detail-actions">
                <button type="button" className="action-button inline-flex items-center justify-center" onClick={() => closeDetail(selected.id)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
