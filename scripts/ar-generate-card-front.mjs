#!/usr/bin/env node
/**
 * Generate a printable card-front PNG procedurally as a starting point.
 * 
 * This is a PLACEHOLDER — meant to be swapped for a designer-made card front
 * once the holder has a final design. The PNG it generates IS feature-rich
 * enough for MindAR to track reliably (gradient + text + accent shapes provide
 * the corner features mind-ar's tracker needs).
 *
 * Usage:
 *   node scripts/ar-generate-card-front.mjs <slug>
 *
 * Outputs:
 *   public/cards/<slug>/card-front.png   (1024 × 663 px = 85×55mm @ ~300dpi-ish)
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
  console.error("Usage: node scripts/ar-generate-card-front.mjs <slug>");
  process.exit(1);
}

const cardJsonPath = path.join(process.cwd(), "data", "cards", `${slug}.json`);
const card = JSON.parse(await fs.readFile(cardJsonPath, "utf8"));

const outDir = path.join(process.cwd(), "public", "cards", slug);
await fs.mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, "card-front.png");

// Output dimensions — 85×55mm at ~300dpi = 1004×650, round to even
const W = 1020;
const H = 660;
const PAD = 60;

const { primary, secondary, accent, textOnBrand } = card.brand;

// Build an SVG that renders into a PNG. SVG gives us crisp gradients + text.
// Important for MindAR tracking: include several high-contrast shapes that act
// as distinctive corner features (4-6 well-separated detail anchors).
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- background gradient -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- holographic accent shapes that double as tracking corners -->
  <circle cx="${W - 120}" cy="120" r="80" fill="url(#orb)"/>
  <circle cx="120" cy="${H - 120}" r="60" fill="url(#orb)"/>

  <!-- corner glyphs (high-contrast points the tracker likes) -->
  <rect x="${PAD}" y="${PAD}" width="32" height="4" fill="${textOnBrand}"/>
  <rect x="${PAD}" y="${PAD}" width="4" height="32" fill="${textOnBrand}"/>
  <rect x="${W - PAD - 32}" y="${PAD}" width="32" height="4" fill="${textOnBrand}"/>
  <rect x="${W - PAD - 4}" y="${PAD}" width="4" height="32" fill="${textOnBrand}"/>
  <rect x="${PAD}" y="${H - PAD - 4}" width="32" height="4" fill="${textOnBrand}"/>
  <rect x="${PAD}" y="${H - PAD - 32}" width="4" height="32" fill="${textOnBrand}"/>
  <rect x="${W - PAD - 32}" y="${H - PAD - 4}" width="32" height="4" fill="${textOnBrand}"/>
  <rect x="${W - PAD - 4}" y="${H - PAD - 32}" width="4" height="32" fill="${textOnBrand}"/>

  <!-- name (large) -->
  <text x="${PAD + 8}" y="${H / 2 - 20}"
        font-family="Helvetica, Arial, sans-serif"
        font-size="62" font-weight="700"
        fill="${textOnBrand}">${escapeXml(card.name)}</text>

  <!-- role -->
  <text x="${PAD + 8}" y="${H / 2 + 30}"
        font-family="Helvetica, Arial, sans-serif"
        font-size="22" font-weight="400" letter-spacing="2"
        fill="${textOnBrand}" opacity="0.85">${escapeXml(card.role)}</text>

  <!-- studio -->
  ${card.studio ? `<text x="${PAD + 8}" y="${H - PAD - 24}"
        font-family="Helvetica, Arial, sans-serif"
        font-size="28" font-weight="700" letter-spacing="4"
        fill="${textOnBrand}">${escapeXml(card.studio.toUpperCase())}</text>` : ""}

  <!-- "scan with camera" prompt (tiny, for finishing touch) -->
  <text x="${W - PAD - 8}" y="${H - PAD - 8}"
        font-family="Helvetica, Arial, sans-serif"
        font-size="11" letter-spacing="3" text-anchor="end"
        fill="${textOnBrand}" opacity="0.7">SCAN WITH CAMERA ↗</text>
</svg>
`.trim();

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log(`✅ Wrote ${outPath} (${W}×${H})`);

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  }[c]));
}
