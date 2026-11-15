import fs from "node:fs";
import sharp from "sharp";

const icon = "public/branding/pokeradar-icon.webp";
const logo = "public/branding/pokeradar-logo.webp";

function ico(images) {
  const count = images.length;
  let offset = 6 + count * 16;
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(count, 4);
  const entries = [];
  const parts = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += img.png.length;
    entries.push(entry);
    parts.push(img.png);
  }
  return Buffer.concat([dir, ...entries, ...parts]);
}

const contain = (size) =>
  sharp(icon)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

const sizes = [16, 32, 48, 180, 192, 512];
const pngs = {};
for (const size of sizes) {
  pngs[size] = await contain(size);
}

fs.writeFileSync("public/branding/icon-32.png", pngs[32]);
fs.writeFileSync("public/branding/icon-192.png", pngs[192]);
fs.writeFileSync("public/branding/icon-512.png", pngs[512]);
fs.writeFileSync("public/branding/apple-touch-icon.png", pngs[180]);

const icoBuf = ico([
  { size: 16, png: pngs[16] },
  { size: 32, png: pngs[32] },
  { size: 48, png: pngs[48] },
]);
fs.writeFileSync("public/branding/favicon.ico", icoBuf);
fs.writeFileSync("src/app/favicon.ico", icoBuf);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="a" cx="50%" cy="46%" r="58%">
      <stop offset="0%" stop-color="#1E3AA8"/>
      <stop offset="58%" stop-color="#0B1E35"/>
      <stop offset="100%" stop-color="#05070E"/>
    </radialGradient>
    <radialGradient id="b" cx="50%" cy="42%" r="26%">
      <stop offset="0%" stop-color="#B88CFF" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#B88CFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="c" cx="50%" cy="48%" r="18%">
      <stop offset="0%" stop-color="#4FC3FF" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4FC3FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#05070E"/>
  <rect width="1200" height="630" fill="url(#a)"/>
  <rect width="1200" height="630" fill="url(#b)"/>
  <rect width="1200" height="630" fill="url(#c)"/>
  <g fill="#C0C7D6">
    <circle cx="120" cy="80" r="1.2" opacity="0.8"/>
    <circle cx="260" cy="140" r="0.9" opacity="0.45"/>
    <circle cx="980" cy="90" r="1.3" opacity="0.7"/>
    <circle cx="1080" cy="210" r="0.8" opacity="0.4"/>
    <circle cx="160" cy="520" r="1.1" opacity="0.55"/>
    <circle cx="1040" cy="540" r="1" opacity="0.5"/>
  </g>
</svg>`;

const mark = await sharp(logo).resize({ width: 980, height: 520, fit: "inside" }).toBuffer();
await sharp(Buffer.from(svg))
  .composite([{ input: mark, gravity: "centre" }])
  .png({ compressionLevel: 9 })
  .toFile("public/branding/og.png");

const og = await sharp("public/branding/og.png").metadata();
console.log("og", og.width, og.height, fs.statSync("public/branding/og.png").size);
console.log("ico", fs.statSync("src/app/favicon.ico").size);
