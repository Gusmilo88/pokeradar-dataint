import { EXPEDITION_ZONES, HABITAT_LABEL } from "@/lib/expedition/argentina";
import type { Sighting } from "@/lib/expedition/argentina";
import { speciesLabel } from "@/lib/pokeapi/labels";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function EncounterIndex({
  sightings,
  selectedId,
  knownNames,
  revealedIds,
  onSelect,
}: {
  sightings: readonly Sighting[];
  selectedId: string | null;
  knownNames: ReadonlyMap<string, string>;
  revealedIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3 pl-8">
      <h3 className="font-mono text-[10px] tracking-[0.18em] text-quiet uppercase">Índice</h3>
      <div className="mt-3 space-y-3">
        {EXPEDITION_ZONES.map((zone) => {
          const items = sightings.filter((sighting) => sighting.zoneId === zone.id);
          return (
            <section key={zone.id} aria-labelledby={`zona-${zone.id}`}>
              <h4 id={`zona-${zone.id}`} className="font-mono text-[11px] tracking-[0.12em] text-quiet uppercase">
                {zone.code} · {zone.name}
                <span className="ml-2 normal-case">{HABITAT_LABEL[zone.habitat]}</span>
              </h4>
              {items.length === 0 ? (
                <p className="mt-1 text-xs text-quiet">Sin especies.</p>
              ) : (
                <ul className="mt-1">
                  {items.map((sighting) => {
                    const selected = sighting.id === selectedId;
                    const revealed = revealedIds.has(sighting.id);
                    const name = revealed
                      ? (knownNames.get(sighting.speciesName) ?? speciesLabel(sighting.speciesName))
                      : "???";
                    return (
                      <li key={sighting.id}>
                        <button
                          type="button"
                          className={
                            selected
                              ? "min-h-11 w-full border-l-2 border-amber py-1.5 pl-3 text-left text-sm text-amber"
                              : "min-h-11 w-full border-l-2 border-transparent py-1.5 pl-3 text-left text-sm text-ink hover:border-phosphor/40"
                          }
                          aria-pressed={selected}
                          aria-label={
                            revealed
                              ? `${name}. Expedición ${pad(sighting.expeditionNumber)}.`
                              : `Expedición ${pad(sighting.expeditionNumber)}. Identidad desconocida.`
                          }
                          onClick={() => onSelect(sighting.id)}
                        >
                          {pad(sighting.expeditionNumber)} · {name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-quiet">
        Los colores del mapa son acentos de la expedición, no biomas ni provincias. Seis señales todavía no tienen región de campo.
      </p>
    </div>
  );
}
