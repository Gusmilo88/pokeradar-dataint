import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const source = path.join(
  process.cwd(),
  "node_modules",
  "maplibre-gl",
  "dist",
  "maplibre-gl-worker.mjs",
);
const target = path.join(process.cwd(), "public", "maplibre-gl-worker.js");

await mkdir(path.dirname(target), { recursive: true });
await copyFile(source, target);
