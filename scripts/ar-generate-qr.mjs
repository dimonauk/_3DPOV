#!/usr/bin/env node
/**
 * Generate a QR code SVG for a card holder.
 *
 * Used both as a build-time output (to bake into print-ready card backs)
 * and as a runtime asset (served by /api/cards/[slug]/qr.svg). Pointing the
 * QR at a stable canonical URL is what makes the card "scannable by anyone".
 *
 * Usage:
 *   PUBLIC_BASE_URL=https://holoflow.co.uk node scripts/ar-generate-qr.mjs <slug>
 *
 * Reads:  data/cards/<slug>.json
 * Writes: public/cards/<slug>/qr.svg
 */
import QRCode from "qrcode";
import { promises as fs } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
  console.error("Usage: node scripts/ar-generate-qr.mjs <slug>");
  process.exit(1);
}

const card = JSON.parse(
  await fs.readFile(path.join(process.cwd(), "data", "cards", `${slug}.json`), "utf8"),
);

const base = process.env.PUBLIC_BASE_URL || "https://holoflow.co.uk";
const targetUrl = `${base.replace(/\/$/, "")}/c/${slug}`;

const outDir = path.join(process.cwd(), "public", "cards", slug);
await fs.mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, "qr.svg");

const svg = await QRCode.toString(targetUrl, {
  type: "svg",
  errorCorrectionLevel: "H", // high error correction so artwork overlay survives
  margin: 1,                  // tight margin (the print layout will add its own)
  color: {
    dark: "#000000",
    light: "#00000000",       // transparent — overlays cleanly on any card design
  },
  width: 1024,
});

await fs.writeFile(outPath, svg, "utf8");
console.log(`✅ Wrote ${outPath}`);
console.log(`   Encodes: ${targetUrl}`);
