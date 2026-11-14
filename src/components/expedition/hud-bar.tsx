import { RadarMark } from "@/components/expedition/radar-mark";
import { SoundToggle } from "@/components/expedition/sound-toggle";

export function HudBar({
  seen,
  caught,
  notebookOpen,
  onOpen,
  onDex,
}: {
  seen: number | null;
  caught: number | null;
  notebookOpen: boolean;
  onOpen: () => void;
  onDex: () => void;
}) {
  const label =
    seen === null || caught === null ? "…" : `${seen} vistas · ${caught} capturadas`;

  return (
    <header className="relative z-20 border-b border-phosphor/20 bg-abyss px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RadarMark />
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
              DataInt · Argentina
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">PokéRadar</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="rounded-full border border-amber/40 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-amber uppercase">
            {label}
          </p>
          <SoundToggle />
          <button type="button" className="action-button inline-flex items-center justify-center" onClick={onDex}>
            Pokédex
          </button>
          {notebookOpen ? null : (
            <button type="button" className="action-button hidden lg:inline-flex" onClick={onOpen}>
              Bitácora
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
