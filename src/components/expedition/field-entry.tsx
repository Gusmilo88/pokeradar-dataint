"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { DossierEntry } from "@/components/expedition/use-dossier";
import { HABITAT_LABEL, type ExpeditionZone } from "@/lib/expedition/argentina";
import { speciesLabel, statLabel, STAT_SCALE, typeLabel } from "@/lib/pokeapi/labels";

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function FieldEntry({
  entry,
  zone,
}: {
  entry: DossierEntry;
  zone: ExpeditionZone;
}) {
  const { species, pokemon } = entry;
  const displayName = species.spanishName ?? speciesLabel(species.name);
  const image = pokemon.sprites.officialArtwork ?? pokemon.sprites.front_default;
  const [imageFailed, setImageFailed] = useState(false);
  const showVariety = species.varieties.length > 1 || pokemon.name !== species.name;
  const showDexGap = pokemon.id !== species.id;

  return (
    <article aria-labelledby="ficha-titulo" className="px-5 py-4 pl-8">
      <p className="font-mono text-[10px] tracking-[0.18em] text-amber uppercase">
        Registro · {dexNumber(species.id)}
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="ficha-titulo" className="text-2xl font-semibold tracking-tight text-ink">
            {displayName}
          </h3>
          <p className="mt-1 font-mono text-xs text-quiet">
            Pokédex {dexNumber(species.id)}
            {showDexGap ? ` · variedad ${dexNumber(pokemon.id)}` : ""}
          </p>
          <p className="mt-2 text-sm text-ink">
            {pokemon.types.map((slot) => typeLabel(slot.type.name)).join(" · ")}
          </p>
        </div>
        {image && !imageFailed ? (
          // PokéAPI sirve el sprite directo. next/image pediría un remotePattern que esta ficha no necesita.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`Imagen de ${displayName} provista por PokéAPI`}
            width={88}
            height={88}
            className="h-20 w-20 shrink-0 object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <p className="grid h-20 w-20 shrink-0 place-items-center border border-dashed border-quiet/40 px-2 text-center font-mono text-[10px] leading-4 text-quiet">
            PokéAPI no envió una imagen usable
          </p>
        )}
      </div>
      {showVariety ? (
        <p className="mt-3 text-sm leading-6 text-quiet">
          Esta especie tiene {species.varieties.length}{" "}
          {species.varieties.length === 1 ? "variedad" : "variedades"}. La ficha muestra la
          variedad por defecto ({pokemon.name}). Las demás no se consultaron.
        </p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {pokemon.stats.map((stat) => {
          const width = Math.min(100, (stat.base_stat / STAT_SCALE) * 100);
          return (
            <li key={stat.stat.name}>
              <div className="flex items-baseline justify-between gap-3 font-mono text-[11px] text-quiet">
                <span>{statLabel(stat.stat.name)}</span>
                <span className="text-ink">{stat.base_stat}</span>
              </div>
              <div className="mt-1 h-px bg-phosphor/20">
                <motion.div
                  className="h-px origin-left bg-phosphor"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ width: `${width}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm leading-6 text-quiet">
        Encuentro simulado en {zone.name}, {zone.region}. Hábitat de referencia:{" "}
        {HABITAT_LABEL[zone.habitat]} ({zone.habitat}). No es una aparición real.
      </p>
    </article>
  );
}
