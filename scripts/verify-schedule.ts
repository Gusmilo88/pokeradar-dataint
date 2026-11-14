import {
  appearanceHint,
  argentinaClock,
  isFieldWild,
  isWindowOpen,
  TIME_WINDOWS,
} from "../src/lib/expedition/schedule";

function at(hour: number, minute: number): Date {
  return new Date(Date.UTC(2026, 10, 14, hour + 3, minute));
}

function minutes(hour: number, minute: number): number {
  return argentinaClock(at(hour, minute)).minutes;
}

const checks: [string, number, number, boolean][] = [
  ["eevee", 4, 59, false],
  ["eevee", 5, 0, true],
  ["eevee", 7, 59, true],
  ["eevee", 8, 0, false],
  ["voltorb", 17, 59, false],
  ["voltorb", 18, 0, true],
  ["voltorb", 21, 59, true],
  ["voltorb", 22, 0, false],
  ["meowth", 19, 59, false],
  ["meowth", 20, 0, true],
  ["meowth", 23, 59, true],
  ["meowth", 0, 0, true],
  ["meowth", 4, 59, true],
  ["meowth", 5, 0, false],
  ["koffing", 20, 59, false],
  ["koffing", 21, 0, true],
  ["koffing", 2, 59, true],
  ["koffing", 3, 0, false],
  ["ditto", 23, 59, false],
  ["ditto", 0, 0, true],
  ["ditto", 3, 59, true],
  ["ditto", 4, 0, false],
];

const names = new Map(TIME_WINDOWS.map((window) => [window.speciesName, window.encounterId]));
for (const [name, hour, minute, open] of checks) {
  const id = names.get(name);
  if (!id || isFieldWild(id, at(hour, minute)) !== open) {
    throw new Error(`${name} ${hour}:${minute} esperaba ${open}, minutos ${minutes(hour, minute)}`);
  }
}

if (isFieldWild("kanto-144", at(12, 0)) !== true) {
  throw new Error("El enclave no tiene horario");
}
if (!isWindowOpen(20 * 60, 5 * 60, 23 * 60 + 59) || isWindowOpen(20 * 60, 5 * 60, 5 * 60)) {
  throw new Error("La ventana que cruza medianoche falló");
}
const eevee = TIME_WINDOWS.find((window) => window.speciesName === "eevee");
if (!eevee || appearanceHint(eevee) !== "Suele aparecer entre las 05:00 y las 08:00 (hora de Argentina).") {
  throw new Error("La pista horaria cambió");
}
if (TIME_WINDOWS.length !== 5) {
  throw new Error("Tienen que ser cinco especies con horario");
}

console.log("OK schedule windows=5 midnight=open enclave=free");
