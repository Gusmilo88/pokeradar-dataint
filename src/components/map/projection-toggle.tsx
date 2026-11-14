"use client";

import { useRef } from "react";
import type { PlanetMode } from "@/lib/map/globe";

export function ProjectionToggle({
  mode,
  showArgentina,
  onMode,
  onArgentina,
}: {
  mode: PlanetMode;
  showArgentina: boolean;
  onMode: (mode: PlanetMode) => void;
  onArgentina: () => void;
}) {
  const globeRef = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<HTMLButtonElement>(null);

  function choose(next: PlanetMode) {
    onMode(next);
    window.requestAnimationFrame(() => {
      (next === "globe" ? globeRef : mapRef).current?.focus();
    });
  }

  return (
    <div className="planet-controls">
      <div
        className="planet-toggle"
        role="group"
        aria-label="Proyección"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
          }
          event.preventDefault();
          choose(event.key === "ArrowRight" ? "mercator" : "globe");
        }}
      >
        <button
          ref={globeRef}
          type="button"
          aria-pressed={mode === "globe"}
          onClick={() => onMode("globe")}
        >
          Globo
        </button>
        <button
          ref={mapRef}
          type="button"
          aria-pressed={mode === "mercator"}
          onClick={() => onMode("mercator")}
        >
          Mapa
        </button>
      </div>
      {showArgentina ? (
        <button type="button" className="planet-approach" onClick={onArgentina}>
          Ver Argentina
        </button>
      ) : null}
    </div>
  );
}
