"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import { TEAM_LIMIT } from "@/lib/expedition/team";
import { speciesLabel } from "@/lib/pokeapi/labels";
import { blackWhiteStill } from "@/lib/pokeapi/sprites";

interface DragState {
  index: number;
  x: number;
  y: number;
  moved: boolean;
}

function labelFor(id: string, names: ReadonlyMap<string, string>): string {
  const card = KANTO_CATALOG.find((entry) => entry.encounterId === id);
  return card ? (names.get(card.speciesName) ?? speciesLabel(card.speciesName)) : "Integrante";
}

export function TeamDock({
  members,
  names,
  onRemove,
  onReorder,
}: {
  members: readonly string[];
  names: ReadonlyMap<string, string>;
  onRemove: (encounterId: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState<number | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);
  const skipClick = useRef(false);
  const slots = Array.from({ length: TEAM_LIMIT }, (_, index) => members[index] ?? null);
  const pendingName = pending ? labelFor(pending, names) : "";

  useEffect(() => {
    if (!pending) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPending(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  function targetIndex(event: ReactPointerEvent<HTMLElement>): number | null {
    const node = document.elementFromPoint(event.clientX, event.clientY);
    const slot = node instanceof Element ? node.closest<HTMLElement>("[data-team-index]") : null;
    if (!slot) {
      return null;
    }
    const index = Number(slot.dataset.teamIndex);
    if (!Number.isInteger(index)) {
      return null;
    }
    return Math.min(index, Math.max(0, members.length - 1));
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { index, x: event.clientX, y: event.clientY, moved: false };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) {
      return;
    }
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8) {
      current.moved = true;
    }
    if (current.moved) {
      setOver(targetIndex(event));
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    drag.current = null;
    setOver(null);
    if (!current) {
      return;
    }
    if (current.moved) {
      skipClick.current = true;
      const target = targetIndex(event);
      if (target !== null) {
        onReorder(current.index, target);
      }
    }
  }

  function onKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onReorder(index, index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onReorder(index, index + 1);
    }
  }

  return (
    <section className="team-dock" aria-label="Equipo de expedición">
      <button
        type="button"
        className="action-button lg:hidden"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Equipo {members.length}/{TEAM_LIMIT}
      </button>
      <div className={open ? "grid gap-2" : "hidden gap-2 lg:grid"}>
        <p className="font-mono text-[10px] tracking-[0.16em] text-amber uppercase">Equipo {members.length}/{TEAM_LIMIT}</p>
        <div className="team-slots">
          {slots.map((id, index) => {
            if (!id) {
              return <span key={`empty-${index}`} className="team-empty" data-team-index={index} aria-hidden="true" />;
            }
            const label = labelFor(id, names);
            const card = KANTO_CATALOG.find((entry) => entry.encounterId === id);
            return (
              <button
                key={id}
                type="button"
                className={over === index ? "team-slot is-over" : "team-slot"}
                data-team-index={index}
                aria-label={`${label}. Arrastrá para reordenar. Tocá para quitar.`}
                aria-roledescription="integrante del equipo"
                onPointerDown={(event) => onPointerDown(event, index)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                  drag.current = null;
                  setOver(null);
                }}
                onKeyDown={(event) => onKey(event, index)}
                onClick={() => {
                  if (skipClick.current) {
                    skipClick.current = false;
                    return;
                  }
                  setPending(id);
                }}
              >
                {card ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blackWhiteStill(card.nationalId)} alt="" draggable={false} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {pending ? (
        <div className="team-confirm" role="dialog" aria-modal="true" aria-labelledby="team-confirm-title">
          <button type="button" className="team-confirm-scrim" aria-label="Cancelar" onClick={() => setPending(null)} />
          <div className="team-confirm-card">
            <p id="team-confirm-title">¿Querés quitar a {pendingName} del equipo?</p>
            <div className="team-confirm-actions">
              <button
                type="button"
                className="action-button"
                autoFocus
                onClick={() => {
                  onRemove(pending);
                  setPending(null);
                }}
              >
                Quitar
              </button>
              <button type="button" className="action-button" onClick={() => setPending(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
