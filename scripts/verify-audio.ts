import { crySource } from "../src/lib/expedition/cries";

const both = crySource({ latest: "latest.ogg", legacy: "legacy.ogg" });
if (both.first !== "latest.ogg" || both.fallback !== "legacy.ogg") throw new Error("latest");
const legacy = crySource({ latest: null, legacy: "legacy.ogg" });
if (legacy.first !== "legacy.ogg" || legacy.fallback !== null) throw new Error("legacy");
const none = crySource({ latest: null, legacy: null });
if (none.first !== null) throw new Error("vacío");
if (crySource(null).first !== null) throw new Error("sin ficha");

console.log("OK audio cry=latest fallback=legacy");
