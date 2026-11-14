import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import { speciesLabel } from "@/lib/pokeapi/labels";

/**
 * Único lugar para cambiar las especies de cada medalla.
 * El nombre visible sale del catálogo. La vitrina y el motor no se tocan.
 *
 * Camino activo: `allCaptured` (todas las especies del conjunto).
 * Una condición futura se agrega como otro `kind` en `BadgeRule`
 * y se resuelve en `measured` (`evaluate.ts`).
 */

export interface BadgePalette {
  metal: string;
  gem: string;
  glow: string;
  wash: string;
  edge: string;
}

export interface BadgeSpecies {
  encounterId: string;
  label: string;
}

export interface AllCapturedRule {
  kind: "allCaptured";
  speciesIds: readonly string[];
}

export type BadgeRule = AllCapturedRule;

export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  condition: string;
  rule: BadgeRule;
  species: readonly BadgeSpecies[];
  assetPath: string;
  palette: BadgePalette;
  rarity: "kanto";
  visualClass: string;
}

export const BADGE_CASE_ASSET = "/assets/medallas/vitrina.webp";

const CAPTURE_ALL = "Capturá todas las especies de este conjunto.";

function speciesRows(ids: readonly string[]): BadgeSpecies[] {
  const seen = new Set<string>();
  return ids.map((encounterId) => {
    if (seen.has(encounterId)) {
      throw new Error(`Medalla con especie repetida: ${encounterId}`);
    }
    seen.add(encounterId);
    const entry = KANTO_CATALOG.find((item) => item.encounterId === encounterId);
    if (!entry) {
      throw new Error(`Medalla con especie fuera del catálogo: ${encounterId}`);
    }
    return { encounterId, label: speciesLabel(entry.speciesName) };
  });
}

function medal(input: {
  id: string;
  name: string;
  description: string;
  palette: BadgePalette;
  speciesIds: readonly string[];
}): BadgeDefinition {
  const species = speciesRows(input.speciesIds);
  return {
    id: input.id,
    slug: input.id,
    name: input.name,
    description: input.description,
    condition: CAPTURE_ALL,
    rule: { kind: "allCaptured", speciesIds: species.map((item) => item.encounterId) },
    species,
    assetPath: `/assets/medallas/${input.id}.webp`,
    palette: input.palette,
    rarity: "kanto",
    visualClass: `badge-tone-${input.id}`,
  };
}

export const BADGES: readonly BadgeDefinition[] = [
  // Roca: montaña y cueva. Aerodactyl es el enclave fósil.
  medal({
    id: "roca",
    name: "Roca",
    description: "Esmalte de pizarra y gema ocre. Se gana en la montaña y en la cueva.",
    palette: { metal: "#d5dde8", gem: "#eef3f8", glow: "#f7fbff", wash: "#1a2430", edge: "#c5d0dc" },
    speciesIds: ["kanto-074", "kanto-076", "kanto-095", "kanto-142"],
  }),
  // Cascada: línea de agua de campo, del arroyo a la costa.
  medal({
    id: "cascada",
    name: "Cascada",
    description: "Agua atrapada en metal claro. Sale del río, la cascada y la costa.",
    palette: { metal: "#b7e4f8", gem: "#3ec4e8", glow: "#d7f6ff", wash: "#062433", edge: "#7fd4f0" },
    speciesIds: ["kanto-007", "kanto-129", "kanto-130", "kanto-131", "kanto-009", "kanto-118"],
  }),
  // Trueno: eléctricos de campo. Zapdos es el enclave de tormenta.
  medal({
    id: "trueno",
    name: "Trueno",
    description: "Oro eléctrico. El brillo queda listo para el relámpago.",
    palette: { metal: "#f3d56a", gem: "#ffe14a", glow: "#fff6b0", wash: "#2a2208", edge: "#ffe38a" },
    speciesIds: ["kanto-025", "kanto-100", "kanto-125", "kanto-081", "kanto-145"],
  }),
  // Arcoíris: jardín, planta, vuelo y hada.
  medal({
    id: "arcoiris",
    name: "Arcoíris",
    description: "El arco sobre el jardín. Planta, vuelo y un toque de hada.",
    palette: { metal: "#f7f1e4", gem: "#ff77c8", glow: "#fff4fb", wash: "#241428", edge: "#ffd0ea" },
    speciesIds: ["kanto-001", "kanto-069", "kanto-103", "kanto-012", "kanto-036"],
  }),
  // Alma: veneno y sombra, la medalla rosa.
  medal({
    id: "alma",
    name: "Alma",
    description: "Rosa profundo. Veneno, sombra y lo que no se ve de día.",
    palette: { metal: "#f0b7d8", gem: "#c46bff", glow: "#ffd0f2", wash: "#2a1024", edge: "#e7a0e0" },
    speciesIds: ["kanto-109", "kanto-042", "kanto-015", "kanto-094", "kanto-073"],
  }),
  // Pantano: mente y agua quieta. Mewtwo y Mew son los enclaves de laboratorio y bosque.
  medal({
    id: "pantano",
    name: "Pantano",
    description: "Oro de ciénaga. Mente quieta, agua lenta y lo que casi no aparece.",
    palette: { metal: "#f0d78a", gem: "#ffd15a", glow: "#fff1b8", wash: "#2a220c", edge: "#ffe08a" },
    speciesIds: ["kanto-079", "kanto-054", "kanto-121", "kanto-150", "kanto-151"],
  }),
  // Volcán: fuego de campo. Moltres es el enclave de brasa.
  medal({
    id: "volcan",
    name: "Volcán",
    description: "Fuego en el borde del metal. Llama de campo y de leyenda.",
    palette: { metal: "#ffb199", gem: "#e23b2f", glow: "#ffd0c2", wash: "#2a0c0c", edge: "#ff8a6a" },
    speciesIds: ["kanto-004", "kanto-006", "kanto-058", "kanto-146"],
  }),
  // Tierra: suelo, arena y hueso.
  medal({
    id: "tierra",
    name: "Tierra",
    description: "Verde de suelo vivo. Arena, hueso y cuerno.",
    palette: { metal: "#b7e7c4", gem: "#3dce7a", glow: "#d6ffe4", wash: "#0c2418", edge: "#7dffb0" },
    speciesIds: ["kanto-027", "kanto-050", "kanto-104", "kanto-105", "kanto-111"],
  }),
];
