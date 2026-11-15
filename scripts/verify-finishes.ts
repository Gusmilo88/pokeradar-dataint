import { readFileSync } from "node:fs";

import { qaCatch } from "../src/lib/badges/qa";
import { emptyBadgeLedger } from "../src/lib/badges/ledger";
import {
  equippedFinish,
  equipFinish,
  FINISH_KEY,
  FINISH_KEY_V1,
  parseEquipped,
  serializeFinish,
} from "../src/lib/expedition/finishes";
import { emptyProgress, markCaught, markSeen, parseProgress, serializeProgress } from "../src/lib/expedition/progress";
import {
  CARD_FINISHES,
  equipableFinishes,
  FINISH_SCOPE,
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

if (CARD_FINISHES.map((finish) => finish.id).join() !== "base,bronze,silver,gold,diamond") {
  fail("Los cinco acabados no están en orden.");
}
if (FINISH_SCOPE !== "Disponible para las especies capturadas. No cambia tipo, poder ni estadísticas.") {
  fail("La descripción del acabado cambió.");
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
  fail("El nivel 9 adelantó el Diamante.");
}
if (idsAt(10) !== "base,bronze,silver,gold,diamond") {
  fail(`El nivel 10 no abre Diamante: ${idsAt(10)}.`);
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
if (plateForLevel(1) !== "base" || plateForLevel(3) !== "bronze" || plateForLevel(5) !== "silver" || plateForLevel(8) !== "gold" || plateForLevel(10) !== "diamond") {
  fail("El sello del perfil no sigue el metal del nivel.");
}

if (equippedFinish(null, 10) !== "base") {
  fail("Sin preferencia la colección no quedó en Base.");
}
if (equipFinish("base", "gold", 3) !== "base") {
  fail("Un acabado de nivel superior se equipó.");
}
if (equipFinish("bronze", "gold", 8) !== "gold" || equipFinish("gold", "base", 8) !== "base") {
  fail("El equipamiento global no reemplaza el acabado anterior.");
}

const stored = serializeFinish("gold");
if (parseEquipped(stored) !== "gold" || !stored.includes("\"version\":2") || stored.includes("kanto-")) {
  fail("La selección global no sobrevivió el guardado.");
}
if (equippedFinish(stored, 8) !== "gold" || equippedFinish(stored, 3) !== "base") {
  fail("Un acabado guardado por encima del nivel no volvió a Base.");
}
const renamed = JSON.stringify({ version: 2, finish: "prismatic" });
if (parseEquipped(renamed) !== "diamond" || equippedFinish(renamed, 10) !== "diamond") {
  fail("El acabado Prismático guardado no se leyó como Diamante.");
}

const legacy = JSON.stringify({
  version: 1,
  choices: [
    { id: "kanto-025", finish: "gold" },
    { id: "kanto-144", finish: "silver" },
  ],
});
if (parseEquipped(legacy) !== "legacy" || equippedFinish(legacy, 10) !== "base") {
  fail("Las preferencias por especie se convirtieron en un acabado global.");
}
if (parseEquipped("no es json") !== null || parseEquipped(JSON.stringify({ version: 2, finish: "mythic" })) !== null) {
  fail("Un documento roto se aceptó.");
}

const prior = parseProgress(JSON.stringify({ version: 1, seen: ["kanto-025"], caught: ["kanto-025"] }));
if (!prior || equippedFinish(null, 2) !== "base") {
  fail("Un progreso anterior no sigue en Base.");
}
const legacyDocument: unknown = JSON.parse(serializeProgress(prior ?? emptyProgress()));
if (typeof legacyDocument !== "object" || legacyDocument === null || "finish" in legacyDocument || "finishes" in legacyDocument) {
  fail("El progreso v1 absorbió los acabados.");
}

const again = markCaught(markCaught(emptyProgress(), "kanto-025"), "kanto-025");
const revealed = markSeen(emptyProgress(), "kanto-025");
if (again.caught.size !== 1 || revealed.caught.size !== 0 || equipFinish("base", "bronze", 1) !== "base") {
  fail("Ver o repetir una captura cambió el acabado.");
}

const player = serializeFinish("bronze");
const simulated = qaCatch(new Set<string>(), emptyBadgeLedger(), ["kanto-144"], "2026-11-14T00:00:00.000Z");
if (player !== serializeFinish("bronze") || simulated.caught.has("kanto-025")) {
  fail("La demostración de medallas escribió acabados.");
}

const demoSource = readFileSync(new URL("../src/components/expedition/use-badge-demo.ts", import.meta.url), "utf8");
if (demoSource.includes("FINISH_KEY") || demoSource.includes("localStorage")) {
  fail("La demostración pública toca los acabados.");
}
const resetSource = readFileSync(new URL("../src/components/expedition/use-progress.ts", import.meta.url), "utf8");
const finishSource = readFileSync(new URL("../src/lib/expedition/finishes.ts", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../src/components/expedition/use-finishes.ts", import.meta.url), "utf8");
if (
  !resetSource.includes("clearStoredFinishes()")
  || !hookSource.includes("FINISH_KEY_V1")
  || !hookSource.includes("FINISH_KEY")
  || !finishSource.includes(FINISH_KEY)
  || !finishSource.includes(FINISH_KEY_V1)
) {
  fail("Reiniciar la expedición no limpia los acabados viejos y nuevos.");
}
if (finishSource.includes("kanto-") || hookSource.includes("assignFinish")) {
  fail("El acabado sigue eligiendo por especie.");
}

const cardSource = readFileSync(new URL("../src/components/expedition/pokedex-view.tsx", import.meta.url), "utf8");
if (!cardSource.includes("tcg-front") || !cardSource.includes("tcg-back") || !cardSource.includes("album-stats") || !cardSource.includes("data-finish={shown")) {
  fail("El frente o el reverso de la carta dejó de estar.");
}
if (cardSource.includes("data-finish={state") || cardSource.includes("Cualquiera") || !cardSource.includes("Limpiar filtros")) {
  fail("La grilla sigue el acabado o el filtro Cualquiera sigue presente.");
}
const chooserSource = readFileSync(new URL("../src/components/expedition/finish-chooser.tsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("../src/components/expedition/trainer-profile.tsx", import.meta.url), "utf8");
if (!chooserSource.includes("Equipar") || !profileSource.includes("FinishChooser")) {
  fail("Falta el botón Equipar en el perfil.");
}
if (cardSource.includes("FinishChooser")) {
  fail("La carta abierta todavía elige acabados.");
}
const albumCss = readFileSync(new URL("../src/components/expedition/album.css", import.meta.url), "utf8");
const profileCss = readFileSync(new URL("../src/components/expedition/trainer-profile.css", import.meta.url), "utf8");
if (!albumCss.includes("finish-prism") || !albumCss.includes("prefers-reduced-motion") || !albumCss.includes("animation: none")) {
  fail("El brillo de Diamante no se apaga con movimiento reducido.");
}
if (albumCss.includes(".album-card[data-state=\"caught\"][data-finish")) {
  fail("La ficha pequeña todavía pinta un acabado.");
}
if (!profileCss.includes("max-width: 720px") || !profileCss.includes("prefers-reduced-motion")) {
  fail("El perfil no declara teléfono ni movimiento reducido.");
}

const levels: Array<[number, CardFinishId]> = [
  [1, "base"],
  [3, "bronze"],
  [5, "silver"],
  [8, "gold"],
  [10, "diamond"],
];
for (const [level, finish] of levels) {
  if (equipFinish("base", finish, level) !== finish) {
    fail(`El nivel ${level} no permite ${finish}.`);
  }
}

console.log("OK finishes base=1 bronze=3 silver=5 gold=8 diamond=10");
