"use client";

import { useState } from "react";
import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import { TEAM_LIMIT } from "@/lib/expedition/team";
import { speciesLabel } from "@/lib/pokeapi/labels";
import { blackWhiteStill } from "@/lib/pokeapi/sprites";

export function TeamDock({
  members,
  names,
  onRemove,
  onMove,
}: {
  members: readonly string[];
  names: ReadonlyMap<string, string>;
  onRemove: (encounterId: string) => void;
  onMove: (index: number, delta: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(false);
  const slots = Array.from({ length: TEAM_LIMIT }, (_, index) => members[index] ?? null);

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
              return <span key={`empty-${index}`} className="team-empty" aria-hidden="true" />;
            }
            const card = KANTO_CATALOG.find((entry) => entry.encounterId === id);
            const label = card ? (names.get(card.speciesName) ?? speciesLabel(card.speciesName)) : "Integrante";
            return (
              <button
                key={id}
                type="button"
                className="team-slot"
                aria-label={`${label}. Quitar del equipo.`}
                onClick={() => onRemove(id)}
              >
                {card ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blackWhiteStill(card.nationalId)} alt="" draggable={false} />
                ) : null}
              </button>
            );
          })}
        </div>
        {members.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            {members.map((id, index) => {
              const card = KANTO_CATALOG.find((entry) => entry.encounterId === id);
              const label = card ? (names.get(card.speciesName) ?? speciesLabel(card.speciesName)) : id;
              return (
                <span key={id} className="inline-flex gap-1">
                  <button type="button" className="action-button" disabled={index === 0} onClick={() => onMove(index, -1)}>
                    {label} antes
                  </button>
                  <button type="button" className="action-button" disabled={index === members.length - 1} onClick={() => onMove(index, 1)}>
                    después
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
