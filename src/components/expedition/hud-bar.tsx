import { RadarMark } from "@/components/expedition/radar-mark";

export function HudBar({
  status,
  count,
}: {
  status: "loading" | "ready" | "error";
  count: number;
}) {
  const label =
    status === "ready"
      ? `${count} encuentros`
      : status === "error"
        ? "Sin hábitats"
        : "Leyendo hábitats";

  return (
    <header className="relative z-20 border-b border-phosphor/20 bg-abyss px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RadarMark />
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] tracking-[0.22em] text-phosphor uppercase">
              DataInt · Expedición
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-2xl">
              PokéRadar
              <span className="ml-2 font-normal text-quiet">Argentina</span>
            </h1>
          </div>
        </div>
        <p className="shrink-0 rounded-full border border-amber/40 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-amber uppercase">
          {label}
        </p>
      </div>
    </header>
  );
}
