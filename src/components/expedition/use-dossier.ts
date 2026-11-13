"use client";

import { useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/errors/message";
import { getPokemonForSpecies } from "@/lib/pokeapi/client";
import type { PokemonSpecies, PokemonSummary } from "@/lib/pokeapi/types";

export type DossierPhase = "idle" | "loading" | "ready" | "error";

export interface DossierEntry {
  speciesName: string;
  species: PokemonSpecies;
  pokemon: PokemonSummary;
}

export function useDossier(
  speciesName: string | null,
  onReady?: (entry: DossierEntry) => void,
): {
  phase: DossierPhase;
  entry: DossierEntry | null;
  message: string | null;
  retry: () => void;
} {
  const [entry, setEntry] = useState<DossierEntry | null>(null);
  const [errorName, setErrorName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [awaitingName, setAwaitingName] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const request = useRef(0);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!speciesName) {
      request.current += 1;
      return;
    }

    const ticket = request.current + 1;
    request.current = ticket;
    const name = speciesName;

    void getPokemonForSpecies(name).then(
      (value) => {
        if (ticket !== request.current) {
          return;
        }
        setAwaitingName((current) => (current === name ? null : current));
        setErrorName(null);
        setMessage(null);
        const nextEntry = {
          speciesName: name,
          species: value.species,
          pokemon: value.pokemon,
        };
        setEntry(nextEntry);
        onReadyRef.current?.(nextEntry);
      },
      (error: unknown) => {
        if (ticket !== request.current) {
          return;
        }
        setAwaitingName((current) => (current === name ? null : current));
        setErrorName(name);
        setMessage(errorMessage(error, "PokéAPI no entregó la ficha."));
      },
    );
  }, [speciesName, retryToken]);

  const phase: DossierPhase = !speciesName
    ? "idle"
    : awaitingName === speciesName
      ? "loading"
      : entry?.speciesName === speciesName
        ? "ready"
        : errorName === speciesName
          ? "error"
          : "loading";

  return {
    phase,
    entry: phase === "ready" ? entry : null,
    message: phase === "error" ? message : null,
    retry: () => {
      if (!speciesName) {
        return;
      }
      setAwaitingName(speciesName);
      setRetryToken((value) => value + 1);
    },
  };
}
