import { emptyProgress, markCaught } from "../src/lib/expedition/progress";
import { addMember, moveMember, parseTeam, removeMember, reorderMembers, serializeTeam, TEAM_LIMIT } from "../src/lib/expedition/team";

let progress = emptyProgress();
progress = markCaught(progress, "kanto-025");
progress = markCaught(progress, "kanto-052");
progress = markCaught(progress, "kanto-001");
const caught = progress.caught;

let team = addMember([], "kanto-025", caught);
team = addMember(team, "kanto-025", caught);
team = addMember(team, "kanto-999", caught);
team = addMember(team, "kanto-052", caught);
if (team.join(",") !== "kanto-025,kanto-052") throw new Error("alta");
team = moveMember(team, 0, 1);
if (team.join(",") !== "kanto-052,kanto-025") throw new Error("orden");
const dragged = reorderMembers(["kanto-025", "kanto-052", "kanto-001"], 0, 2);
if (dragged.join(",") !== "kanto-052,kanto-001,kanto-025") throw new Error("arrastre");
if (reorderMembers(dragged, 2, 2).join(",") !== dragged.join(",")) throw new Error("mismo lugar");
team = removeMember(team, "kanto-052");
if (team.join(",") !== "kanto-025") throw new Error("baja");

const raw = serializeTeam(["kanto-025", "kanto-001"]);
if (parseTeam(raw, caught)?.join(",") !== "kanto-025,kanto-001") throw new Error("lectura");
if (parseTeam(serializeTeam(["kanto-025", "kanto-025"]), caught) !== null) throw new Error("duplicado");
if (parseTeam(serializeTeam(["kanto-004"]), caught) !== null) throw new Error("no capturado");
if (parseTeam(serializeTeam(Array.from({ length: TEAM_LIMIT + 1 }, () => "kanto-025")), caught) !== null) {
  throw new Error("tope");
}
if (parseTeam("{", caught) !== null) throw new Error("json");
const full = addMember(Array.from({ length: TEAM_LIMIT }, (_, index) => `kanto-${String(index + 1).padStart(3, "0")}`), "kanto-025", new Set(["kanto-025", ...Array.from({ length: TEAM_LIMIT }, (_, index) => `kanto-${String(index + 1).padStart(3, "0")}`)]));
if (full.length !== TEAM_LIMIT) throw new Error("no entra el séptimo");

console.log("OK team limit=6 duplicates=rejected");
