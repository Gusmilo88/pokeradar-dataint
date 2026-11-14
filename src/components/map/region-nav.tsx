"use client";

import { useRef, useState } from "react";
import { ATLAS_FRAMES, type AtlasFrame } from "@/lib/map/atlas-frames";

export function RegionNav({ onSelect }: { onSelect: (frame: AtlasFrame) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<AtlasFrame["id"] | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function moveFocus(current: HTMLButtonElement, direction: 1 | -1) {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons || buttons.length === 0) {
      return;
    }
    const index = Array.from(buttons).indexOf(current);
    const next = buttons[(index + direction + buttons.length) % buttons.length];
    next?.focus();
  }

  return (
    <nav className="atlas-nav" aria-label="Explorar regiones">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="atlas-frames"
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) {
              window.setTimeout(() => {
                listRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
              }, 0);
            }
            return next;
          });
        }}
      >
        Explorar
      </button>
      <ul
        id="atlas-frames"
        ref={listRef}
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
          }
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
            return;
          }
          if (!(event.target instanceof HTMLButtonElement)) {
            return;
          }
          event.preventDefault();
          moveFocus(event.target, event.key === "ArrowDown" ? 1 : -1);
        }}
      >
        {ATLAS_FRAMES.map((frame) => (
          <li key={frame.id}>
            <button
              type="button"
              aria-pressed={active === frame.id}
              onClick={() => {
                setActive(frame.id);
                onSelect(frame);
                close();
              }}
            >
              {frame.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
