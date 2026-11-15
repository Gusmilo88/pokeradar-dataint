"use client";

import { useEffect, useRef, useState } from "react";
import "./cinematic-intro.css";

const INTRO_KEY = "pokeradar.intro.session";
const INTRO_MS = 4200;

export function CinematicIntro() {
  const [phase, setPhase] = useState<"boot" | "play" | "done">("boot");
  const skipRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") {
      const frame = window.requestAnimationFrame(() => setPhase("done"));
      return () => window.cancelAnimationFrame(frame);
    }

    const root = document.getElementById("expedicion");
    root?.setAttribute("inert", "");
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    skipRef.current?.focus();

    const finish = () => {
      if (finished.current) {
        return;
      }
      finished.current = true;
      try {
        window.sessionStorage.setItem(INTRO_KEY, "seen");
      } catch {
        /* la sesión no está disponible */
      }
      document.documentElement.dataset.intro = "done";
      root?.removeAttribute("inert");
      setPhase("done");
      const map = document.getElementById("mapa");
      if (map instanceof HTMLElement) {
        map.focus({ preventScroll: true });
      } else {
        previous?.focus();
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus();
      }
    };

    const timer = window.setTimeout(finish, INTRO_MS);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      root?.removeAttribute("inert");
    };
  }, []);

  if (phase === "done") {
    return null;
  }

  return (
    <div
      className="cinematic-gate"
      role="dialog"
      aria-modal="true"
      aria-label="Introducción de PokéRadar"
    >
      <div className="cinematic-sky" />
      <div className="cinematic-stars" aria-hidden="true" />
      <div className="cinematic-core" aria-hidden="true" />
      <div className="cinematic-emblem-slot" aria-hidden="true">
        <div className="cinematic-emblem">
          <img src="/branding/pokeradar-icon.webp" alt="" width={1312} height={1199} />
          <span className="cinematic-sweep" />
        </div>
        <span className="cinematic-spark" data-i="1" />
        <span className="cinematic-spark" data-i="2" />
        <span className="cinematic-spark" data-i="3" />
        <span className="cinematic-spark" data-i="4" />
      </div>
      <img
        className="cinematic-logo"
        src="/branding/pokeradar-logo.webp"
        alt="PokéRadar — Expedición Argentina"
        width={1448}
        height={1086}
      />
      <button
        ref={skipRef}
        type="button"
        className="cinematic-skip"
        onClick={() => {
          document.documentElement.dataset.intro = "done";
          try {
            window.sessionStorage.setItem(INTRO_KEY, "seen");
          } catch {
            /* la sesión no está disponible */
          }
          finished.current = true;
          document.getElementById("expedicion")?.removeAttribute("inert");
          setPhase("done");
          document.getElementById("mapa")?.focus({ preventScroll: true });
        }}
      >
        Saltar
      </button>
    </div>
  );
}
