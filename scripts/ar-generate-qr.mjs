#!/usr/bin/env node
/**
 * Generate a branded QR code SVG for a card holder.
 *
 * Replaces the plain-black QR with brand-coloured, dot-styled output
 * using qr-code-styling. Each card's QR picks up its own palette so
 * a printed batch reads as a curated set rather than identical
 * mystery-meat squares.
 *
 * Used both as a build-time output (baked into print-ready card backs)
 * and as a runtime asset (served by /api/cards/[slug]/qr.svg).
 *
 * Usage:
 *   PUBLIC_BASE_URL=https://holoflow.co.uk node scripts/ar-generate-qr.mjs <slug>
 *
 * Reads:  data/cards/<slug>.json
 * Writes: public/cards/<slug>/qr.svg
 *
 * # What "branded" means here
 *
 *   - Dot style: rounded (default) — softer than classic squares,
 *     still scans on any normal QR reader.
 *   - Colour: gradient from brand.primary to brand.secondary.
 *   - Corner squares: brand.accent — visually anchors the QR.
 *   - Centre: dropped pixels under the eye position so a small
 *     studio sigil can be composited in by the print pipeline if
 *     desired. High error correction (H = 30%) means the QR
 *     survives the gap.
 *   - Background: transparent so the QR overlays cleanly on any
 *     printed card colour.
 */

import QRCodeStyling from "qr-code-styling";
import { JSDOM } from "jsdom";
import { promises as fs } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
  console.error("Usage: node scripts/ar-generate-qr.mjs <slug>");
  process.exit(1);
}

const card = JSON.parse(
  await fs.readFile(
    path.join(process.cwd(), "data", "cards", `${slug}.json`),
    "utf8",
  ),
);

const base = process.env.PUBLIC_BASE_URL || "https://holoflow.co.uk";
const targetUrl = `${base.replace(/\/$/, "")}/c/${slug}`;

// qr-code-styling needs a DOM. Node has no <canvas> / <document> so
// stub a JSDOM and patch globals it touches.
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const primary = card?.brand?.primary ?? "#FF6FB5";
const secondary = card?.brand?.secondary ?? "#B488E0";
const accent = card?.brand?.accent ?? primary;

const qr = new QRCodeStyling({
  width: 1024,
  height: 1024,
  type: "svg",
  data: targetUrl,
  margin: 6,
  qrOptions: {
    typeNumber: 0,
    mode: "Byte",
    errorCorrectionLevel: "H",
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.32,
    margin: 4,
  },
  dotsOptions: {
    type: "rounded",
    gradient: {
      type: "linear",
      rotation: Math.PI / 4,
      colorStops: [
        { offset: 0, color: primary },
        { offset: 1, color: secondary },
      ],
    },
  },
  cornersSquareOptions: {
    type: "extra-rounded",
    color: accent,
  },
  cornersDotOptions: {
    type: "dot",
    color: accent,
  },
  backgroundOptions: {
    color: "transparent",
  },
});

const outDir = path.join(process.cwd(), "public", "cards", slug);
await fs.mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, "qr.svg");

const blob = await qr.getRawData("svg");
let svgText;
if (typeof blob === "string") {
  svgText = blob;
} else if (Buffer.isBuffer(blob)) {
  svgText = blob.toString("utf8");
} else if (blob && typeof blob.text === "function") {
  // Browser Blob shape
  svgText = await blob.text();
} else {
  // Last-ditch: stringify whatever came back
  svgText = String(blob ?? "");
}

await fs.writeFile(outPath, svgText, "utf8");
console.log(`✅ Wrote ${outPath}`);
console.log(`   Encodes: ${targetUrl}`);
console.log(`   Palette: ${primary} → ${secondary} (corners ${accent})`);
