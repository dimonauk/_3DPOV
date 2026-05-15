#!/usr/bin/env node
/**
 * scripts/cards-bulk-upload.mjs
 *
 * Bulk-upload a directory of .glb files to Vercel Blob and emit a
 * matching data/cards/*.json template for each. Used to seed demo
 * libraries faster than uploading one at a time through the designer.
 *
 * Usage:
 *   # First pull production env (gets BLOB_READ_WRITE_TOKEN)
 *   vercel env pull .env.local
 *
 *   # Upload + scaffold:
 *   node scripts/cards-bulk-upload.mjs <dir>
 *
 * For each <file>.glb:
 *   - Uploads to Vercel Blob at: cards/library/<slug>.glb
 *   - Writes data/cards/<slug>.json with sensible defaults
 *     (slug derived from filename; brand palette rotated through a
 *     small preset list; visibility = public).
 *   - Skips if data/cards/<slug>.json already exists.
 *
 * Idempotent on the JSON side, additive on the Blob side. The cards
 * appear on /cards automatically — that page reads getAllCards() and
 * filters on `public: true`.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname, resolve } from "node:path";
import { put } from "@vercel/blob";

// Tiny .env loader — no extra dependency. Only needs BLOB_READ_WRITE_TOKEN.
async function loadEnvFile(path) {
  try {
    const text = await readFile(path, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      const isDouble = val.startsWith('"') && val.endsWith('"');
      const isSingle = val.startsWith("'") && val.endsWith("'");
      if (isDouble || isSingle) val = val.slice(1, -1);
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    // File missing — caller fails later if BLOB_READ_WRITE_TOKEN unset.
  }
}

await loadEnvFile(".env.local");
await loadEnvFile(".env.production.local");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN not in env. Run: vercel env pull .env.local",
  );
  process.exit(1);
}

const argDir = process.argv[2];
if (!argDir) {
  console.error("Usage: node scripts/cards-bulk-upload.mjs <dir-of-glbs>");
  process.exit(1);
}

const sourceDir = resolve(argDir);
if (!existsSync(sourceDir)) {
  console.error(`Directory not found: ${sourceDir}`);
  process.exit(1);
}

// Brand palettes — small library, rotated through deterministically.
const PALETTES = [
  { primary: "#FF6FB5", secondary: "#B488E0", accent: "#FFC1E3", font: "display", textOnBrand: "#FFFFFF" },
  { primary: "#8FCD9E", secondary: "#C8E6C9", accent: "#4A7C59", font: "serif",   textOnBrand: "#FFFFFF" },
  { primary: "#00BFFF", secondary: "#4B0082", accent: "#FFFFFF", font: "mono",    textOnBrand: "#FFFFFF" },
  { primary: "#FF7F50", secondary: "#FFB996", accent: "#FFFFE0", font: "serif",   textOnBrand: "#FFFFFF" },
  { primary: "#8B0000", secondary: "#DAA520", accent: "#FFF5E1", font: "display", textOnBrand: "#FFFFFF" },
  { primary: "#228B22", secondary: "#ADFF2F", accent: "#DAA520", font: "display", textOnBrand: "#FFFFFF" },
  { primary: "#663399", secondary: "#008B8B", accent: "#B87333", font: "display", textOnBrand: "#FFFFFF" },
  { primary: "#3D2C8D", secondary: "#916BBF", accent: "#C996CC", font: "display", textOnBrand: "#FFFFFF" },
];

function slugify(name) {
  return basename(name, extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function prettyName(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const cardsJsonDir = resolve("data/cards");

let entries;
try {
  entries = await readdir(sourceDir);
} catch (err) {
  console.error(`Could not read directory: ${err.message}`);
  process.exit(1);
}

const glbs = entries.filter((e) => e.toLowerCase().endsWith(".glb"));
if (glbs.length === 0) {
  console.error(`No .glb files in ${sourceDir}`);
  process.exit(1);
}

console.log(`Found ${glbs.length} .glb file(s) in ${sourceDir}\n`);

let uploaded = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < glbs.length; i++) {
  const file = glbs[i];
  const slug = slugify(file);
  const name = prettyName(slug);
  const jsonPath = join(cardsJsonDir, `${slug}.json`);

  if (existsSync(jsonPath)) {
    console.log(`[${i + 1}/${glbs.length}] skip ${slug} — JSON already exists`);
    skipped++;
    continue;
  }

  const sourcePath = join(sourceDir, file);
  let bytes;
  try {
    bytes = await readFile(sourcePath);
  } catch (err) {
    console.error(`[${i + 1}/${glbs.length}] fail ${slug} — read failed: ${err.message}`);
    failed++;
    continue;
  }

  // Magic-byte check matches the upload API's validation.
  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "glTF") {
    console.error(`[${i + 1}/${glbs.length}] fail ${slug} — not a valid GLB`);
    failed++;
    continue;
  }

  const blobPath = `cards/library/${slug}.glb`;

  let blob;
  try {
    blob = await put(blobPath, bytes, {
      access: "public",
      contentType: "model/gltf-binary",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error(`[${i + 1}/${glbs.length}] fail ${slug} — upload failed: ${err.message}`);
    failed++;
    continue;
  }

  const palette = PALETTES[i % PALETTES.length];
  const sizeKb = (bytes.length / 1024).toFixed(1);

  const card = {
    slug,
    name,
    role: "Library Specimen",
    studio: "Holo-Flow Studio",
    tagline: "Bulk-uploaded via cards-bulk-upload.mjs",
    contact: {
      email: "hello@holoflow.co.uk",
      website: "https://holoflow.co.uk",
      handles: [{ platform: "instagram", handle: "@dimonauk" }],
    },
    brand: palette,
    ar: {
      targetImage: "/cards/dimona/card-front.png",
      targetMind: "/cards/dimona/target.mind",
      model: blob.url,
      modelUSDZ: "",
      modelScale: 1.0,
      modelRotation: [0, 0, 0],
      modelPosition: [0, 0.05, 0],
      description: `Library specimen ${name}, ${sizeKb} KB. Auto-uploaded.`,
      autoRotate: true,
      lighting: {
        ambientIntensity: 1.0,
        directionalIntensity: 1.4,
        directionalAngle: 35,
      },
    },
    print: { width_mm: 85, height_mm: 55, bleed_mm: 3, safe_mm: 4 },
    issuedAt: new Date().toISOString(),
    public: true,
  };

  await writeFile(jsonPath, JSON.stringify(card, null, 2) + "\n", "utf8");
  console.log(`[${i + 1}/${glbs.length}] ok   ${slug} -> ${blob.url} (${sizeKb} KB)`);
  uploaded++;
}

console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
if (uploaded > 0) {
  console.log("Commit data/cards/*.json and push — /cards picks them up automatically.");
}
