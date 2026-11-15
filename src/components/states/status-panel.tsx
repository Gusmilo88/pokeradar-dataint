import type { ReactNode } from "react";

type StatusTone = "loading" | "error" | "empty";

const toneLabel: Record<StatusTone, string> = {
  loading: "Cargando",
  error: "Error",
  empty: "Sin selección",
};

export function StatusPanel({
  tone,
  title,
  description,
  action,
  align = "center",
}: {
  tone: StatusTone;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "center" | "start";
}) {
  const centered = align === "center";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        centered
          ? "flex max-w-sm flex-col items-center gap-3 text-center"
          : "flex max-w-md flex-col items-start gap-2 text-left"
      }
    >
      {tone === "loading" ? (
        <span className="radar-spinner" aria-hidden="true" />
      ) : (
        <span
          aria-hidden="true"
          className={
            tone === "error"
              ? "h-2 w-2 rounded-full bg-danger"
              : "h-2 w-2 rounded-full bg-phosphor"
          }
        />
      )}
      {description ? (
        <p className="font-mono text-[10px] tracking-[0.22em] text-phosphor uppercase">
          {toneLabel[tone]}
        </p>
      ) : null}
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {description ? <p className="text-sm leading-6 text-quiet">{description}</p> : null}
      {action}
    </div>
  );
}
