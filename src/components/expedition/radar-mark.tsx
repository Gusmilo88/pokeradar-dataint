export function RadarMark() {
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center" aria-hidden="true">
      <span className="absolute inset-0 rounded-full border border-phosphor/40" />
      <span className="absolute inset-1.5 rounded-full border border-phosphor/25" />
      <span className="h-1.5 w-1.5 rounded-full bg-phosphor" />
    </span>
  );
}
