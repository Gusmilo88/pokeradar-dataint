"use client";

import { useRef } from "react";
import { Earth, Map } from "lucide-react";
import type { PlanetMode } from "@/lib/map/globe";

export function ProjectionToggle({
  mode,
  onMode,
}: {
  mode: PlanetMode;
  onMode: (mode: PlanetMode) => void;
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
    <div
      className="planet-toggle"
      role="group"
      aria-label="Proyección del mapa"
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
        className="planet-toggle-btn"
        aria-label="Vista globo"
        title="Globo"
        aria-pressed={mode === "globe"}
        onClick={() => onMode("globe")}
      >
        <Earth aria-hidden="true" strokeWidth={1.75} />
      </button>
      <button
        ref={mapRef}
        type="button"
        className="planet-toggle-btn"
        aria-label="Vista mapa plano"
        title="Mapa"
        aria-pressed={mode === "mercator"}
        onClick={() => onMode("mercator")}
      >
        <Map aria-hidden="true" strokeWidth={1.75} />
      </button>
    </div>
  );
}
