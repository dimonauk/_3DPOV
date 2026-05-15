#!/usr/bin/env node
/**
 * Generate a batch of branded QRs for a single card, each tagged
 * with a different ?src= value so the owner can track scans per
 * print run / venue / campaign in the analytics dashboard.
 *
 * Usage:
 *   node scripts/ar-generate-batch-qr.mjs <slug> <count> [prefix]
 *
 * Example:
 *   node scripts/ar-generate-batch-qr.mjs protean-apex 5 batch
 *
 *   produces public/cards/protean-apex/batches/batch/
 *     qr-001.svg  → /c/protean-apex?src=batch-001
 *     qr-002.svg  → /c/protean-apex?src=batch-002
 *     qr-003.svg  → /c/protean-apex?src=batch-003
 *     qr-004.svg  → /c/protean-apex?src=batch-004
 *     qr-005.svg  → /c/protean-apex?src=batch-005
 *     manifest.json
 *
 * Or with a custom prefix:
 *   node scripts/ar-generate-batch-qr.mjs dimona 3 conference
 *   → ?src=conference-001, conference-002, conference-003
 *
 * Use cases:
 *   - Different QRs per venue at a conference
 *   - A/B test which printed batch performs better
 *   - Cohort tracking ("these 50 cards went out in our March mailout")
 *   - Influencer campaigns ("this run was for Lulu, that run was for Mira")
 */

import QRCodeStyling from "qr-code-styling";
import { JSDOM } from "jsdom";
import { promises as fs } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
const countArg = process.argv[3];
const prefix = process.argv[4] || "batch";

if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
  console.error("Usage: node scripts/ar-generate-batch-qr.mjs <slug> <count> [prefix]");
  process.exit(1);
}
const count = parseInt(countArg, 10);
if (!Number.isFinite(count) || count < 1 || count > 1000) {
  console.error("count must be between 1 and 1000");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/i.test(prefix)) {
  console.error("prefix may only contain letters, numbers, and hyphens");
  process.exit(1);
}

const card = JSON.parse(
  await fs.readFile(
    path.join(process.cwd(), "data", "cards", `${slug}.json`),
    "utf8",
  ),
);

const base = process.env.PUBLIC_BASE_URL || "https://holoflow.co.uk";
const baseUrl = `${base.replace(/\/$/, "")}/c/${slug}`;

// qr-code-styling needs DOM globals on Node.
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const primary = card?.brand?.primary ?? "#FF6FB5";
const secondary = card?.brand?.secondary ?? "#B488E0";
const accent = card?.brand?.accent ?? primary;

const outDir = path.join(
  process.cwd(),
  "public",
  "cards",
  slug,
  "batches",
  prefix,
);
await fs.mkdir(outDir, { recursive: true });

const manifest = {
  card: slug,
  prefix,
  count,
  generatedAt: new Date().toISOString(),
  baseUrl,
  palette: { primary, secondary, accent },
  codes: [],
};

const pad = (n) => String(n).padStart(String(count).length, "0").padStart(3, "0");

for (let i = 1; i <= count; i++) {
  const id = `${prefix}-${pad(i)}`;
  const url = `${baseUrl}?src=${encodeURIComponent(id)}`;

  const qr = new QRCodeStyling({
    width: 1024,
    height: 1024,
    type: "svg",
    data: url,
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
    backgroundOptions: { color: "transparent" },
  });

  const blob = await qr.getRawData("svg");
  let svgText;
  if (typeof blob === "string") svgText = blob;
  else if (Buffer.isBuffer(blob)) svgText = blob.toString("utf8");
  else if (blob && typeof blob.text === "function") svgText = await blob.text();
  else svgText = String(blob ?? "");

  const filename = `qr-${pad(i)}.svg`;
  await fs.writeFile(path.join(outDir, filename), svgText, "utf8");

  manifest.codes.push({ id, url, file: filename });
  process.stdout.write(`  ✅ ${filename} → ?src=${id}\n`);
}

await fs.writeFile(
  path.join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8",
);

console.log("");
console.log(`Batch '${prefix}' written to:`);
console.log(`  ${outDir}`);
console.log("");
console.log(`Each QR encodes a unique ?src= tag so scans can be tracked`);
console.log(`per print run in /cards/mine/${slug}/analytics under Sources.`);
