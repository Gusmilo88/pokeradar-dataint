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
    <header className="brand-header relative z-20 border-b border-cobalt/40 px-3 py-2 sm:px-6">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <h1 className="min-w-0 flex-1">
          <img
            src="/branding/pokeradar-logo.webp"
            alt="PokéRadar — Expedición Argentina"
            width={1448}
            height={1086}
            className="brand-logo"
            decoding="async"
          />
        </h1>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SoundToggle />
          <button type="button" className="action-button inline-flex items-center justify-center px-3 sm:px-4" onClick={onDex}>
            Pokédex
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-phosphor/55 bg-abyss text-phosphor-strong sm:hidden"
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
