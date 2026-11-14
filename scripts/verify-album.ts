import { albumAccentLabel, albumCounts, albumHitPoints, albumMatches, filterAlbum } from "../src/lib/expedition/album";
import { KANTO_CATALOG } from "../src/lib/expedition/kanto";
import { emptyProgress, markCaught, markSeen } from "../src/lib/expedition/progress";

function fail(message: string): never {
  throw new Error(message);
}

const field = KANTO_CATALOG.find((entry) => entry.nationalId === 129);
const other = KANTO_CATALOG.find((entry) => entry.nationalId === 143);
const articuno = KANTO_CATALOG.find((entry) => entry.nationalId === 144);
const aerodactyl = KANTO_CATALOG.find((entry) => entry.nationalId === 142);
const mew = KANTO_CATALOG.find((entry) => entry.nationalId === 151);
if (!field || !other || !articuno || !aerodactyl || !mew) {
  fail("Faltan fichas del álbum.");
}

const blank = albumCounts(emptyProgress());
if (blank.total !== 56 || blank.seen !== 0 || blank.caught !== 0 || blank.percent !== 0) {
  fail("La colección vacía no está en cero.");
}

const seenOnly = albumCounts(markSeen(emptyProgress(), field.encounterId));
if (seenOnly.seen !== 1 || seenOnly.caught !== 0 || seenOnly.percent !== 0) {
  fail("Un visto se contó como captura.");
}

const oneCatch = markCaught(emptyProgress(), field.encounterId);
const caughtCounts = albumCounts(oneCatch);
if (caughtCounts.seen !== 1 || caughtCounts.caught !== 1 || caughtCounts.percent !== 2) {
  fail("Una captura se contó dos veces o el porcentaje no sale de 56.");
}

let full = emptyProgress();
for (const entry of KANTO_CATALOG) {
  full = markCaught(full, entry.encounterId);
}
const complete = albumCounts(full);
if (complete.seen !== 56 || complete.caught !== 56 || complete.percent !== 100) {
  fail("La colección completa no cierra en 56.");
}

if (albumMatches(articuno, "undiscovered", "articuno") || albumMatches(articuno, "undiscovered", "144")) {
  fail("La búsqueda reveló un especial oculto.");
}
if (!albumMatches(articuno, "undiscovered", "51") || !albumMatches(articuno, "seen", "articuno")) {
  fail("Un dato visible no se pudo buscar.");
}
if (!albumMatches(articuno, "seen", "144") || albumMatches(field, "undiscovered", "129")) {
  fail("El número nacional se usó antes de revelar la carta.");
}

const pending = filterAlbum(
  KANTO_CATALOG,
  markCaught(markSeen(emptyProgress(), field.encounterId), other.encounterId),
  "pending",
  "",
);
if (pending.length !== 1 || pending[0]?.encounterId !== field.encounterId) {
  fail("El filtro de vistos sin capturar mezcló estados.");
}

const hiddenSpecials = filterAlbum(KANTO_CATALOG, emptyProgress(), "reserved", "mew");
if (hiddenSpecials.length !== 0) {
  fail("El filtro de especiales aceptó un nombre oculto.");
}
const specials = filterAlbum(KANTO_CATALOG, emptyProgress(), "reserved", "");
if (specials.length !== 6) {
  fail("Los especiales no son seis.");
}

if (aerodactyl.habitat !== "mountain" || albumAccentLabel(aerodactyl) !== "Fósil") {
  fail("Aerodactyl cambió de clasificación.");
}
if (mew.habitat !== "rare" || albumAccentLabel(mew) !== "Esmeralda") {
  fail("Mew perdió su clasificación.");
}
if (albumAccentLabel(aerodactyl)?.toLowerCase().includes("legend") || albumAccentLabel(mew)?.toLowerCase().includes("legend")) {
  fail("Una carta recibió una etiqueta de legendario.");
}
if (albumHitPoints([{ name: "attack", value: 80 }]) !== null) {
  fail("La carta inventó PS sin la estadística.");
}
if (albumHitPoints([{ name: "hp", value: 90 }, { name: "attack", value: 10 }]) !== 90) {
  fail("El PS no salió de la estadística de vida.");
}

console.log("OK album total=56 filters=5 aerodactyl=fossil mew=grove");
