"use client";

import { useEffect, useState } from "react";
import type { RevealedFacts } from "@/lib/expedition/dex-query";
import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import type { Progress } from "@/lib/expedition/progress";
import { getPokemonForSpecies } from "@/lib/pokeapi/client";
import { speciesLabel } from "@/lib/pokeapi/labels";

export function useRevealedFacts(progress: Progress): ReadonlyMap<string, RevealedFacts> {
  const key = [...progress.seen].sort().join("|");
  const [facts, setFacts] = useState<ReadonlyMap<string, RevealedFacts>>(() => new Map());

  useEffect(() => {
    const ids = new Set(key ? key.split("|") : []);
    const jobs = KANTO_CATALOG.filter((entry) => ids.has(entry.encounterId));
    const controller = new AbortController();
    let cursor = 0;
    const worker = async () => {
      while (!controller.signal.aborted) {
        const index = cursor;
        cursor += 1;
        const entry = jobs[index];
        if (!entry) {
          return;
        }
        try {
          const dossier = await getPokemonForSpecies(entry.speciesName);
          if (controller.signal.aborted) {
            return;
          }
          const stats: Record<string, number> = {};
          for (const stat of dossier.pokemon.stats) {
            stats[stat.stat.name] = stat.base_stat;
          }
          const fact: RevealedFacts = {
            types: dossier.pokemon.types.map((slot) => slot.type.name),
            stats,
            captureRate: dossier.species.capture_rate,
            label: dossier.species.spanishName ?? speciesLabel(dossier.species.name),
          };
          setFacts((current) => new Map(current).set(entry.encounterId, fact));
        } catch {
          if (controller.signal.aborted) {
            return;
          }
        }
      }
    };
    void Promise.all([worker(), worker(), worker()]);
    return () => controller.abort();
  }, [key]);

  return facts;
}
