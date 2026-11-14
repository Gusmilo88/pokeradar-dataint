/**
 * Horarios propios del juego para cinco especies de campo.
 * La hora es America/Argentina/Buenos_Aires, no la del dispositivo.
 * El fin de la ventana es exclusivo. Una ventana que cruza medianoche sigue abierta.
 */

export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export interface TimeWindow {
  encounterId: string;
  speciesName: string;
  start: number;
  end: number;
}

export const TIME_WINDOWS: readonly TimeWindow[] = [
  { encounterId: "kanto-133", speciesName: "eevee", start: 5 * 60, end: 8 * 60 },
  { encounterId: "kanto-100", speciesName: "voltorb", start: 18 * 60, end: 22 * 60 },
  { encounterId: "kanto-052", speciesName: "meowth", start: 20 * 60, end: 5 * 60 },
  { encounterId: "kanto-109", speciesName: "koffing", start: 21 * 60, end: 3 * 60 },
  { encounterId: "kanto-132", speciesName: "ditto", start: 0, end: 4 * 60 },
];

const BY_ID = new Map(TIME_WINDOWS.map((window) => [window.encounterId, window]));

export function timeWindow(encounterId: string): TimeWindow | null {
  return BY_ID.get(encounterId) ?? null;
}

export function formatMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isWindowOpen(start: number, end: number, minutes: number): boolean {
  if (start === end) {
    return false;
  }
  if (start < end) {
    return minutes >= start && minutes < end;
  }
  return minutes >= start || minutes < end;
}

export interface ArgentinaClock {
  minutes: number;
  dayIndex: number;
}

export function argentinaClock(date: Date): ArgentinaClock {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ARGENTINA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") {
      bag[part.type] = part.value;
    }
  }
  let hour = Number(bag.hour);
  const minute = Number(bag.minute);
  if (hour === 24) {
    hour = 0;
  }
  const year = Number(bag.year);
  const month = Number(bag.month);
  const day = Number(bag.day);
  return {
    minutes: hour * 60 + minute,
    dayIndex: Math.floor(Date.UTC(year, month - 1, day) / 86_400_000),
  };
}

/** Las seis reservadas y el resto del campo no tienen ventana. */
export function isFieldWild(encounterId: string, date: Date): boolean {
  const window = timeWindow(encounterId);
  if (!window) {
    return true;
  }
  return isWindowOpen(window.start, window.end, argentinaClock(date).minutes);
}

export type DayPart = "madrugada" | "mañana" | "tarde" | "atardecer" | "noche";

const DAY_PART_HINT: Record<DayPart, string> = {
  madrugada: "Suele aparecer de madrugada.",
  mañana: "Suele aparecer por la mañana.",
  tarde: "Suele aparecer por la tarde.",
  atardecer: "Suele aparecer al atardecer.",
  noche: "Suele aparecer por la noche.",
};

/** La pista pública no dice la hora. El inicio de la ventana elige la franja. */
export function dayPart(start: number): DayPart {
  if (start < 5 * 60) {
    return "madrugada";
  }
  if (start < 12 * 60) {
    return "mañana";
  }
  if (start < 17 * 60) {
    return "tarde";
  }
  if (start < 20 * 60) {
    return "atardecer";
  }
  return "noche";
}

export function appearanceHint(window: TimeWindow): string {
  return DAY_PART_HINT[dayPart(window.start)];
}

export function nextWindowHint(window: TimeWindow, date: Date): string {
  if (isWindowOpen(window.start, window.end, argentinaClock(date).minutes)) {
    return "";
  }
  return appearanceHint(window);
}
