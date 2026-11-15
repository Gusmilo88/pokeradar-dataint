import { RadarMark } from "@/components/expedition/radar-mark";
import { SoundToggle } from "@/components/expedition/sound-toggle";

export function HudBar({
  notebookOpen,
  badgesOpen,
  onOpen,
  onDex,
  onBadges,
}: {
  notebookOpen: boolean;
  badgesOpen: boolean;
  onOpen: () => void;
  onDex: () => void;
  onBadges: () => void;
}) {
  return (
    <header className="relative z-20 border-b border-phosphor/20 bg-abyss px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RadarMark />
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] tracking-[0.18em] text-phosphor uppercase">
              DataInt · Argentina
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">PokéRadar</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SoundToggle />
          <button type="button" className="action-button inline-flex items-center justify-center px-3 sm:px-4" onClick={onDex}>
            Pokédex
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-phosphor/55 bg-[rgba(8,28,38,0.92)] text-phosphor-strong sm:hidden"
            aria-label="Medallas"
            aria-haspopup="dialog"
            aria-expanded={badgesOpen}
            onClick={onBadges}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 6.5 16 12 12 17.5 8 12Z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className="action-button hidden items-center justify-center sm:inline-flex"
            aria-haspopup="dialog"
            aria-expanded={badgesOpen}
            onClick={onBadges}
          >
            Medallas
          </button>
          {notebookOpen ? null : (
            <button
              type="button"
              className="action-button hidden items-center justify-center text-center lg:inline-flex"
              onClick={onOpen}
            >
              Bitácora
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
