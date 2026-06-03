#!/usr/bin/env node
/**
 * Generate placeholder app icons + splash dari brand color.
 *
 * Output:
 *   assets/images/icon.png              1024x1024  (iOS + universal)
 *   assets/images/adaptive-icon.png     1024x1024  (Android adaptive foreground)
 *   assets/images/splash-icon.png        512x512   (splash logo)
 *   assets/images/favicon.png             48x48    (web favicon)
 *
 * Strategi: huruf "S" putih di center, background brand #18c29c, rounded corner.
 * Untuk production proper, replace dengan asset dari designer.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Deps: sharp (npm i -D sharp) — sharp tidak di-include di runtime app.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "assets", "images");
mkdirSync(outDir, { recursive: true });

const BRAND = "#18c29c";
const BRAND_DARK = "#0e8b70";

function iconSvg(size, opts = {}) {
  const { radius = size * 0.22, letter = "S", letterColor = "#ffffff" } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${BRAND_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#g)"/>
  <text x="50%" y="50%" font-family="Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${size * 0.6}" fill="${letterColor}" text-anchor="middle"
        dominant-baseline="central" letter-spacing="-${size * 0.02}">${letter}</text>
</svg>`;
}

function flatBgSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${BRAND}"/>
</svg>`;
}

function splashSvg(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" ry="${size * 0.18}" fill="${BRAND}"/>
  <text x="50%" y="48%" font-family="Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${size * 0.55}" fill="#ffffff" text-anchor="middle"
        dominant-baseline="central" letter-spacing="-${size * 0.02}">S</text>
  <text x="50%" y="82%" font-family="Helvetica, Arial, sans-serif" font-weight="600"
        font-size="${size * 0.08}" fill="#ffffff" opacity="0.85" text-anchor="middle">
    Senopati Academy
  </text>
</svg>`;
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("❌ Missing dep 'sharp'. Run:\n   npm i -D sharp\n");
  process.exit(1);
}

const targets = [
  { name: "icon.png", svg: iconSvg(1024), size: 1024 },
  { name: "adaptive-icon.png", svg: iconSvg(1024, { radius: 0 }), size: 1024 },
  { name: "android-icon-foreground.png", svg: iconSvg(1024, { radius: 0 }), size: 1024 },
  { name: "android-icon-background.png", svg: flatBgSvg(1024), size: 1024 },
  { name: "android-icon-monochrome.png", svg: iconSvg(1024, { radius: 0, letterColor: "#000000" }), size: 1024 },
  { name: "splash-icon.png", svg: splashSvg(512), size: 512 },
  { name: "favicon.png", svg: iconSvg(48, { radius: 10 }), size: 48 },
];

for (const t of targets) {
  const buf = Buffer.from(t.svg, "utf8");
  const out = resolve(outDir, t.name);
  await sharp(buf).png().toFile(out);
  writeFileSync(out + ".svg", t.svg); // simpan source SVG juga
  console.log(`✓ ${t.name}  ${t.size}x${t.size}`);
}

console.log("\n✅ Done. Asset siap untuk Phase 2 development.");
console.log("Untuk production launch ke store: replace pakai asset dari designer.");
