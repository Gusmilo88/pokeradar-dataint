import { readFileSync } from "node:fs";

import { qaCatch } from "../src/lib/badges/qa";
import { emptyBadgeLedger } from "../src/lib/badges/ledger";
import {
  applicableFinishes,
  assignFinish,
  emptyFinishes,
  finishOf,
  parseFinishes,
  readFinishes,
  serializeFinishes,
} from "../src/lib/expedition/finishes";
import { emptyProgress, markCaught, markSeen, parseProgress, serializeProgress } from "../src/lib/expedition/progress";
import {
  CARD_FINISHES,
  equipableFinishes,
  plateForLevel,
  rankForLevel,
  TRAINER_RANKS,
  type CardFinishId,
} from "../src/lib/expedition/trainer-rewards";

function fail(message: string): never {
  throw new Error(message);
}

function idsAt(level: number): string {
  return equipableFinishes(level).map((finish) => finish.id).join();
}

if (CARD_FINISHES.map((finish) => finish.id).join() !== "base,bronze,silver,gold,prismatic") {
  fail("Los cinco acabados no están en orden.");
}
if (idsAt(1) !== "base") {
  fail(`El nivel 1 no queda solo en Base: ${idsAt(1)}.`);
}
if (idsAt(2) !== "base") {
  fail("El nivel 2 abrió un metal.");
}
if (idsAt(3) !== "base,bronze") {
  fail(`El nivel 3 no abre Bronce: ${idsAt(3)}.`);
}
if (idsAt(4) !== "base,bronze") {
  fail("El nivel 4 adelantó la Plata.");
}
if (idsAt(5) !== "base,bronze,silver") {
  fail(`El nivel 5 no abre Plata: ${idsAt(5)}.`);
}
if (idsAt(7) !== "base,bronze,silver") {
  fail("El nivel 7 adelantó el Oro.");
}
if (idsAt(8) !== "base,bronze,silver,gold") {
  fail(`El nivel 8 no abre Oro: ${idsAt(8)}.`);
}
if (idsAt(9) !== "base,bronze,silver,gold") {
  fail("El nivel 9 adelantó el Prismático.");
}
if (idsAt(10) !== "base,bronze,silver,gold,prismatic") {
  fail(`El nivel 10 no abre Prismático: ${idsAt(10)}.`);
}
if (idsAt(0) !== "" || idsAt(11) !== "") {
  fail("Un nivel fuera de rango equipó acabados.");
}

const titles = TRAINER_RANKS.map((rank) => rank.title);
if (titles.length !== 10 || new Set(titles).size !== 10) {
  fail("Los rangos no cubren los diez niveles con títulos distintos.");
}
if (rankForLevel(1) !== "Viajero" || rankForLevel(10) !== "Cronista" || rankForLevel(0) !== null) {
  fail("Los rangos de campo no salen del nivel.");
}
if (titles.some((title) => /gimnasio|líder|campeón/i.test(title) || title.length > 16)) {
  fail("Hay un rango ajeno a la expedición o demasiado largo.");
}
if (plateForLevel(1) !== "base" || plateForLevel(3) !== "bronze" || plateForLevel(5) !== "silver" || plateForLevel(8) !== "gold" || plateForLevel(10) !== "prismatic") {
  fail("El sello del perfil no sigue el metal del nivel.");
}

const caught = new Set(["kanto-025", "kanto-144"]);
const none = emptyFinishes();
if (finishOf(none, "kanto-025") !== "base") {
  fail("Sin preferencia la carta no quedó en Base.");
}

const blocked = assignFinish(none, "kanto-025", "gold", caught, 3);
if (blocked !== none || finishOf(blocked, "kanto-025") !== "base") {
  fail("Un acabado de nivel superior se equipó.");
}
const seenOnly = assignFinish(none, "kanto-129", "bronze", new Set(["kanto-025"]), 10);
if (seenOnly !== none) {
  fail("Una especie no capturada recibió acabado.");
}

const bronze = assignFinish(none, "kanto-025", "bronze", caught, 3);
const silver = assignFinish(bronze, "kanto-144", "silver", caught, 5);
if (finishOf(silver, "kanto-025") !== "bronze" || finishOf(silver, "kanto-144") !== "silver") {
  fail("La personalización no es individual.");
}
const back = assignFinish(silver, "kanto-025", "base", caught, 5);
if (finishOf(back, "kanto-025") !== "base" || finishOf(back, "kanto-144") !== "silver") {
  fail("Volver a Base borró el acabado de otra especie.");
}

const stored = serializeFinishes(silver);
const parsed = parseFinishes(stored);
if (!parsed || finishOf(applicableFinishes(parsed, caught, 5), "kanto-025") !== "bronze") {
  fail("La selección no sobrevivió el guardado.");
}
if (stored.includes("base") || !stored.includes("\"version\":1")) {
  fail("El documento guardó Base o perdió la versión.");
}

const legacy = parseProgress(JSON.stringify({ version: 1, seen: ["kanto-025"], caught: ["kanto-025"] }));
const prior = legacy ? readFinishes(null, legacy.caught, 2) : null;
if (!legacy || !prior || finishOf(prior, "kanto-025") !== "base" || Object.keys(prior).length !== 0) {
  fail("Un progreso anterior no sigue en Base.");
}
const legacyDocument: unknown = JSON.parse(serializeProgress(legacy ?? emptyProgress()));
if (typeof legacyDocument !== "object" || legacyDocument === null || "finish" in legacyDocument || "finishes" in legacyDocument) {
  fail("El progreso v1 absorbió los acabados.");
}

const dirty = JSON.stringify({
  version: 1,
  choices: [
    { id: "kanto-025", finish: "prismatic" },
    { id: "kanto-999", finish: "gold" },
    { id: "kanto-144", finish: "mythic" },
  ],
});
const dirtyParsed = parseFinishes(dirty);
if (!dirtyParsed) {
  fail("Una entrada mala invalidó las demás.");
}
const cleaned = applicableFinishes(dirtyParsed, caught, 8);
if (finishOf(cleaned, "kanto-025") !== "base" || finishOf(cleaned, "kanto-144") !== "base" || "kanto-999" in cleaned) {
  fail("Un acabado inválido no volvió a Base.");
}
if (parseFinishes("no es json") !== null || parseFinishes(JSON.stringify({ version: 2, choices: [] })) !== null) {
  fail("Un documento roto o de otra versión se aceptó.");
}

const again = markCaught(markCaught(emptyProgress(), "kanto-025"), "kanto-025");
if (again.caught.size !== 1 || finishOf(bronze, "kanto-025") !== "bronze") {
  fail("Repetir la captura cambió el acabado.");
}
const revealed = markSeen(emptyProgress(), "kanto-025");
if (revealed.caught.size !== 0 || finishOf(assignFinish(none, "kanto-025", "bronze", revealed.caught, 10), "kanto-025") !== "base") {
  fail("Ver una especie desbloqueó un acabado.");
}

const player = serializeFinishes(bronze);
const simulated = qaCatch(new Set<string>(), emptyBadgeLedger(), ["kanto-144"], "2026-11-14T00:00:00.000Z");
if (serializeFinishes(bronze) !== player || simulated.caught.has("kanto-025")) {
  fail("La demostración de medallas escribió acabados.");
}

const demoSource = readFileSync(new URL("../src/components/expedition/use-badge-demo.ts", import.meta.url), "utf8");
if (demoSource.includes("FINISH_KEY") || demoSource.includes("finishes") || demoSource.includes("localStorage")) {
  fail("La demostración pública toca los acabados.");
}
const resetSource = readFileSync(new URL("../src/components/expedition/use-progress.ts", import.meta.url), "utf8");
if (!resetSource.includes("clearStoredFinishes()")) {
  fail("Reiniciar la expedición no limpia los acabados.");
}

const cardSource = readFileSync(new URL("../src/components/expedition/pokedex-view.tsx", import.meta.url), "utf8");
if (!cardSource.includes("tcg-front") || !cardSource.includes("tcg-back") || !cardSource.includes("album-stats") || !cardSource.includes("data-finish")) {
  fail("El frente o el reverso de la carta dejó de estar.");
}
const albumCss = readFileSync(new URL("../src/components/expedition/album.css", import.meta.url), "utf8");
const profileCss = readFileSync(new URL("../src/components/expedition/trainer-profile.css", import.meta.url), "utf8");
if (!albumCss.includes("finish-prism") || !albumCss.includes("prefers-reduced-motion") || !albumCss.includes("animation: none")) {
  fail("El brillo prismático no se apaga con movimiento reducido.");
}
if (!profileCss.includes("max-width: 720px") || !profileCss.includes("prefers-reduced-motion")) {
  fail("El perfil no declara teléfono ni movimiento reducido.");
}

const levels: Array<[number, CardFinishId]> = [
  [1, "base"],
  [3, "bronze"],
  [5, "silver"],
  [8, "gold"],
  [10, "prismatic"],
];
for (const [level, finish] of levels) {
  const equipped = assignFinish(emptyFinishes(), "kanto-025", finish, new Set(["kanto-025"]), level);
  if (finishOf(equipped, "kanto-025") !== finish) {
    fail(`El nivel ${level} no permite ${finish}.`);
  }
}

console.log("OK finishes base=1 bronze=3 silver=5 gold=8 prism=10");
