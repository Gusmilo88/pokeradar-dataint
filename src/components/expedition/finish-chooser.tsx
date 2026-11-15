"use client";

import { CARD_FINISHES, FINISH_SCOPE, type CardFinishId } from "@/lib/expedition/trainer-rewards";
import "./trainer-profile.css";

export function FinishChooser({
  level,
  equipped,
  preview,
  onPreview,
  onEquip,
}: {
  level: number;
  equipped: CardFinishId;
  preview: CardFinishId;
  onPreview: (id: CardFinishId) => void;
  onEquip: (id: CardFinishId) => void;
}) {
  const detail = CARD_FINISHES.find((finish) => finish.id === preview) ?? CARD_FINISHES[0];
  const locked = level < detail.unlockLevel;
  const active = equipped === detail.id;

  return (
    <div className="finish-chooser" data-no-flip>
      <ul className="trainer-tray" aria-label="Acabados de carta">
        {CARD_FINISHES.map((finish) => {
          const open = level >= finish.unlockLevel;
          return (
            <li key={finish.id}>
              <button
                type="button"
                className="trainer-sample"
                data-finish={finish.id}
                data-state={open ? "open" : "locked"}
                aria-pressed={preview === finish.id}
                aria-label={
                  open
                    ? `${finish.label}, desbloqueado, nivel ${finish.unlockLevel}`
                    : `${finish.label}, bloqueado, requiere nivel ${finish.unlockLevel}`
                }
                onClick={() => onPreview(finish.id)}
              >
                <span className="trainer-sample-metal" data-finish={finish.id} />
                <span className="trainer-sample-name">{finish.label}</span>
                <span className="trainer-sample-level">{open ? "Listo" : `Nv ${finish.unlockLevel}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="trainer-detail" data-finish={detail.id}>
        <strong>{detail.label}.</strong> {FINISH_SCOPE}
      </p>
      <p className="trainer-lock" role="status">
        {locked ? `Se desbloquea en nivel ${detail.unlockLevel}` : active ? "Equipado" : "Listo para equipar"}
      </p>
      <button
        type="button"
        className="trainer-equip"
        disabled={locked || active}
        onClick={() => onEquip(detail.id)}
      >
        Equipar
      </button>
    </div>
  );
}
