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
  const severalForms = species.varieties.length > 1;

  return (
    <article aria-labelledby="ficha-titulo" className="px-5 py-4 pl-8">
      <p className="font-mono text-[10px] tracking-[0.18em] text-amber uppercase">
        {dexNumber(species.id)} · {zone.code}
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="ficha-titulo" className="text-3xl font-semibold tracking-tight text-ink">
            {displayName}
          </h3>
          <p className="mt-2 flex flex-wrap gap-1.5">
            {pokemon.types.map((slot) => (
              <span
                key={slot.type.name}
                className="border border-phosphor/40 px-2 py-0.5 font-mono text-[11px] tracking-[0.08em] text-phosphor-strong uppercase"
              >
                {typeLabel(slot.type.name)}
              </span>
            ))}
          </p>
        </div>
        {image && !imageFailed ? (
          // PokéAPI sirve el sprite directo. next/image pediría un remotePattern que esta ficha no necesita.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`Imagen de ${displayName}`}
            width={96}
            height={96}
            className="h-24 w-24 shrink-0 object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <p className="grid h-24 w-24 shrink-0 place-items-center border border-dashed border-quiet/40 px-2 text-center font-mono text-[10px] leading-4 text-quiet">
            Sin imagen
          </p>
        )}
      </div>
      {severalForms ? (
        <p className="mt-3 font-mono text-[11px] text-quiet">Variedad por defecto.</p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {pokemon.stats.map((stat) => {
          const width = Math.min(100, (stat.base_stat / STAT_SCALE) * 100);
          return (
            <li key={stat.stat.name}>
              <div className="flex items-baseline justify-between gap-3 font-mono text-[11px] text-quiet">
                <span>{statLabel(stat.stat.name)}</span>
                <span className="text-sm text-ink">{stat.base_stat}</span>
              </div>
              <div className="mt-1 h-1 bg-phosphor/15">
                <motion.div
                  className="h-1 origin-left bg-phosphor"
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
      <p className="mt-4 text-sm text-quiet">
        {zone.name} · {HABITAT_LABEL[zone.habitat]}. Encuentro simulado.
      </p>
    </article>
  );
}
