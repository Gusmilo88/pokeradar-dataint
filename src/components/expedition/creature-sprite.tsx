"use client";

import { useState, useSyncExternalStore } from "react";
import { blackWhiteAnimated, blackWhiteStill } from "@/lib/pokeapi/sprites";

function subscribeMotion(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function motionSnapshot(): "reduce" | "allow" {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "allow";
}

export function CreatureSprite({
  nationalId,
  revealed,
  stillUrl,
  animatedUrl,
  label,
}: {
  nationalId: number;
  revealed: boolean;
  stillUrl?: string | null;
  animatedUrl?: string | null;
  /** Solo cuando la criatura ya está revelada. */
  label: string | null;
}) {
  const motion = useSyncExternalStore(subscribeMotion, motionSnapshot, () => "reduce" as const);
  const still = stillUrl || blackWhiteStill(nationalId);
  const animated = animatedUrl || blackWhiteAnimated(nationalId);
  const preferred = revealed && motion === "allow" ? animated : still;
  const [generation, setGeneration] = useState(preferred);
  const [fallback, setFallback] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  if (generation !== preferred) {
    setGeneration(preferred);
    setFallback(null);
    setFailed(false);
  }

  const shown = fallback ?? preferred;

  if (failed) {
    return (
      <p className="grid h-full w-full place-items-center px-2 text-center font-mono text-[10px] leading-4 text-quiet">
        Sin señal
      </p>
    );
  }

  return (
    // El sprite sale del repositorio de PokéAPI. next/image pediría un remotePattern.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shown}
      alt={revealed && label ? `Sprite de ${label}` : ""}
      width={96}
      height={96}
      className={
        revealed
          ? "pixel-sprite h-full w-full object-contain"
          : "pixel-sprite creature-silhouette h-full w-full object-contain"
      }
      style={
        revealed
          ? { imageRendering: "pixelated" }
          : { imageRendering: "pixelated", filter: "brightness(0) invert(1)", opacity: 0.88 }
      }
      loading="lazy"
      onError={() => {
        if (shown !== still) {
          setFallback(still);
          return;
        }
        const repoStill = blackWhiteStill(nationalId);
        if (shown !== repoStill) {
          setFallback(repoStill);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
