"use client";

import { useEffect, useState } from "react";
import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import { getPokemonForSpecies } from "@/lib/pokeapi/client";

/** Tipos de PokéAPI para el filtro de clima. No se muestran si la especie sigue oculta. */
export function useFieldTypes(): ReadonlyMap<string, readonly string[]> {
  const [types, setTypes] = useState<ReadonlyMap<string, readonly string[]>>(() => new Map());

  useEffect(() => {
    const jobs = KANTO_CATALOG.filter((entry) => entry.role === "field");
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
          const names = dossier.pokemon.types.map((slot) => slot.type.name);
          setTypes((current) => new Map(current).set(entry.encounterId, names));
        } catch {
          if (controller.signal.aborted) {
            return;
          }
        }
      }
    };
    void Promise.all([worker(), worker(), worker()]);
    return () => controller.abort();
  }, []);

  return types;
}
