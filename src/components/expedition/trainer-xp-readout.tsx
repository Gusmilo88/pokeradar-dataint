import { assessExpedition } from "@/lib/expedition/trainer-xp";

/** Lectura corta del nivel. La XP sale del conjunto capturado, sin un contador propio. */
export function TrainerXpReadout({ caught }: { caught: ReadonlySet<string> }) {
  const report = assessExpedition(caught);
  if (!report.complete) {
    return (
      <p className="trainer-xp" data-trainer-xp="incomplete">
        XP de expedición incompleta
      </p>
    );
  }

  const { progress } = report;
  const nextText = progress.atCap
    ? "Nivel máximo"
    : `${progress.percent} por ciento hacia el nivel ${progress.nextLevel ?? progress.level}`;

  return (
    <div className="trainer-xp" data-trainer-xp="ready" data-trainer-level={progress.level}>
      <p className="trainer-xp-line">
        <span>
          Nivel <strong>{progress.level}</strong>
        </span>
        <span>
          XP de expedición{" "}
          <strong data-trainer-xp-value={progress.xp}>{progress.xp}</strong>
          {" / "}
          <span data-trainer-xp-max={progress.maxXp}>{progress.maxXp}</span>
        </span>
      </p>
      <div
        className="trainer-xp-track"
        role="progressbar"
        aria-label={progress.atCap ? "Nivel máximo" : `Hacia el nivel ${progress.nextLevel ?? progress.level}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-valuetext={nextText}
      >
        <span className="trainer-xp-fill" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}
