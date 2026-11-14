import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { emptyProgress, markSeen } from "../src/lib/expedition/progress";
import { queryAlbum, type RevealedFacts } from "../src/lib/expedition/dex-query";

const eevee = KANTO_CATALOG.find((entry) => entry.encounterId === "kanto-133");
const meowth = KANTO_CATALOG.find((entry) => entry.encounterId === "kanto-052");
const pikachu = KANTO_CATALOG.find((entry) => entry.encounterId === "kanto-025");
if (!eevee || !meowth || !pikachu) throw new Error("faltan fichas");

let progress = emptyProgress();
progress = markSeen(progress, pikachu.encounterId);
progress = markSeen(progress, eevee.encounterId);

const facts = new Map<string, RevealedFacts>([
  [pikachu.encounterId, { types: ["electric"], stats: { hp: 35, attack: 55, defense: 40, "special-attack": 50, "special-defense": 50, speed: 90 }, captureRate: 190, label: "Pikachu" }],
  [eevee.encounterId, { types: ["normal"], stats: { hp: 55, attack: 55, defense: 50, "special-attack": 45, "special-defense": 65, speed: 55 }, captureRate: 45, label: "Eevee" }],
  [meowth.encounterId, { types: ["electric"], stats: { hp: 999, attack: 999, defense: 999, "special-attack": 999, "special-defense": 999, speed: 999 }, captureRate: 1, label: "Secreto" }],
]);

const electric = queryAlbum(KANTO_CATALOG, progress, "all", "", ["electric"], "any", "hp", "desc", facts);
if (electric.some((entry) => entry.encounterId === meowth.encounterId)) {
  throw new Error("el filtro usó el tipo oculto");
}
if (electric.some((entry) => entry.encounterId === eevee.encounterId)) {
  throw new Error("normal no debía entrar");
}
if (electric[0]?.encounterId !== pikachu.encounterId) throw new Error("eléctrico revelado");

const both = queryAlbum(KANTO_CATALOG, progress, "all", "", ["electric", "normal"], "all", "expedition", "asc", facts);
if (both.length !== 0) throw new Error("AND no debía coincidir con un solo tipo");
const either = queryAlbum(KANTO_CATALOG, progress, "all", "", ["electric", "normal"], "any", "name", "asc", facts);
if (either.map((entry) => entry.encounterId).join(",") !== `${eevee.encounterId},${pikachu.encounterId}`) {
  throw new Error(`OR ${either.map((entry) => entry.speciesName).join(",")}`);
}

const byHp = queryAlbum(KANTO_CATALOG, progress, "all", "", [], "any", "hp", "asc", facts);
const known = byHp.filter((entry) => progress.seen.has(entry.encounterId));
if (known[0]?.encounterId !== pikachu.encounterId || known[1]?.encounterId !== eevee.encounterId) {
  throw new Error("PS ordenó mal");
}
const hiddenTail = byHp.filter((entry) => !progress.seen.has(entry.encounterId));
if (hiddenTail[0]?.expeditionNumber !== 1) throw new Error("los ocultos no quedaron estables");

const missing = new Map(facts);
missing.delete(eevee.encounterId);
const withHole = queryAlbum(KANTO_CATALOG, progress, "all", "", [], "any", "attack", "desc", missing);
const holeKnown = withHole.filter((entry) => entry.encounterId === eevee.encounterId || entry.encounterId === pikachu.encounterId);
if (holeKnown[0]?.encounterId !== pikachu.encounterId) throw new Error("el dato faltante se trató como cero");

console.log("OK dex-query hidden=stable types=revealed");
