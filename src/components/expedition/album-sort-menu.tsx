"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { SORT_KEYS, type SortKey } from "@/lib/expedition/dex-query";

const SORT_LABELS: Record<SortKey, string> = {
  expedition: "Registro",
  name: "Nombre",
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "Ataque especial",
  "special-defense": "Defensa especial",
  speed: "Velocidad",
  difficulty: "Dificultad",
};

export function sortLabel(key: SortKey): string {
  return SORT_LABELS[key];
}

export function AlbumSortMenu({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => Math.max(0, SORT_KEYS.indexOf(value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const buttonId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function choose(index: number) {
    const next = SORT_KEYS[index];
    if (!next) {
      return;
    }
    onChange(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setCursor(Math.max(0, SORT_KEYS.indexOf(value)));
      setOpen(true);
      return;
    }
    if (!open) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((index) => (index + 1) % SORT_KEYS.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((index) => (index - 1 + SORT_KEYS.length) % SORT_KEYS.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setCursor(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setCursor(SORT_KEYS.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(cursor);
    }
  }

  const activeId = `${listId}-${cursor}`;

  return (
    <div className="album-sort-menu" ref={rootRef} onKeyDown={onKey}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        className="album-sort-button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? activeId : undefined}
        aria-label={`Ordenar. ${sortLabel(value)}`}
        onClick={() => {
          setCursor(Math.max(0, SORT_KEYS.indexOf(value)));
          setOpen((current) => !current);
        }}
      >
        {sortLabel(value)}
      </button>
      {open ? (
        <ul id={listId} className="album-sort-list" role="listbox" aria-labelledby={buttonId} tabIndex={-1}>
          {SORT_KEYS.map((key, index) => (
            <li key={key} role="presentation">
              <button
                id={`${listId}-${index}`}
                type="button"
                role="option"
                className="album-sort-option"
                aria-selected={value === key}
                data-active={cursor === index ? "true" : "false"}
                onMouseEnter={() => setCursor(index)}
                onClick={() => choose(index)}
              >
                {sortLabel(key)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
