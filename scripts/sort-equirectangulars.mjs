#!/usr/bin/env node
/**
 * scripts/sort-equirectangulars.mjs
 *
 * Walks a folder of photos. Reads each image's dimensions with sharp.
 * Anything with ~2:1 aspect ratio (1.95..2.05 by default) AND a
 * sensible minimum width gets sorted into `equirectangular/`. Everything
 * else goes to `regular/`. By default it COPIES (operator-safe). Use
 * `--move` if you want files relocated.
 *
 * Why aspect ratio: every modern 360 stitcher writes equirect at
 * exactly 2:1. DJI Avata 360 + Osmo 360 RAW frames are 3840×3840
 * (square, dual-fisheye in one frame — NOT equirect; the dji-osv-format
 * skill explains). Insta360 + GoPro MAX stitched output is always
 * 2:1. Theta Z1 stills are 7296×3648 (2:1). All clearly distinct
 * from regular shots: 3:2 (DSLR), 4:3 (phone vertical), 16:9 (frame
 * grabs).
 *
 * # Usage
 *
 *   node scripts/sort-equirectangulars.mjs <input-dir>
 *
 *   node scripts/sort-equirectangulars.mjs <input-dir> --out <output-dir>
 *   node scripts/sort-equirectangulars.mjs <input-dir> --recurse
 *   node scripts/sort-equirectangulars.mjs <input-dir> --move
 *   node scripts/sort-equirectangulars.mjs <input-dir> --dry-run
 *   node scripts/sort-equirectangulars.mjs <input-dir> --min-width 4096
 *   node scripts/sort-equirectangulars.mjs <input-dir> --aspect 1.95..2.05
 *
 * # Defaults
 *
 *   - aspect-ratio window: 1.95..2.05 (2:1 with 2.5% tolerance)
 *   - min-width: 2048 (skip tiny 2:1 thumbnails)
 *   - output: <input-dir>/equirectangular/ and <input-dir>/regular/
 *   - operation: copy (safe; use --move to relocate)
 *   - recursion: off (one level deep — re-run on subdirs as needed)
 *
 * # Exit codes
 *
 *   0  success — at least one image processed
 *   1  fatal error (input dir missing, sharp not installed, etc.)
 *   2  no images found at all
 */

import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { copyFile, rename } from "node:fs/promises";
import { join, basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch (err) {
  console.error("ERROR: 'sharp' not installed. Run `pnpm install` first.");
  process.exit(1);
}

const SUPPORTED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".tif",
  ".tiff",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
]);

// ---------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(args.length === 0 ? 1 : 0);
}

const inputDir = args[0];
const flags = {
  out: getArg("--out") ?? null,
  recurse: args.includes("--recurse"),
  move: args.includes("--move"),
  dryRun: args.includes("--dry-run") || args.includes("--dry"),
  minWidth: Number(getArg("--min-width") ?? "2048"),
  aspectMin: 1.95,
  aspectMax: 2.05,
};
const aspectArg = getArg("--aspect");
if (aspectArg) {
  const m = /^([\d.]+)\.\.([\d.]+)$/.exec(aspectArg);
  if (!m) {
    console.error(`ERROR: --aspect expects "min..max" (e.g. 1.95..2.05). Got: ${aspectArg}`);
    process.exit(1);
  }
  flags.aspectMin = Number(m[1]);
  flags.aspectMax = Number(m[2]);
}

if (!existsSync(inputDir) || !statSync(inputDir).isDirectory()) {
  console.error(`ERROR: input dir does not exist or is not a directory: ${inputDir}`);
  process.exit(1);
}

const outBase = flags.out ?? inputDir;
const outEquirect = join(outBase, "equirectangular");
const outRegular = join(outBase, "regular");

if (!flags.dryRun) {
  mkdirSync(outEquirect, { recursive: true });
  mkdirSync(outRegular, { recursive: true });
}

console.log(`sort-equirectangulars`);
console.log(`  input:        ${inputDir}`);
console.log(`  out (equi):   ${outEquirect}`);
console.log(`  out (reg):    ${outRegular}`);
console.log(`  recurse:      ${flags.recurse}`);
console.log(`  operation:    ${flags.move ? "move" : "copy"}`);
console.log(`  min-width:    ${flags.minWidth}`);
console.log(`  aspect range: ${flags.aspectMin}..${flags.aspectMax}`);
console.log(`  dry-run:      ${flags.dryRun}`);
console.log("");

// ---------------------------------------------------------------------
// Walk + classify
// ---------------------------------------------------------------------

const counts = { equirect: 0, regular: 0, skipped: 0, errored: 0 };
const samples = { equirect: [], regular: [] };
const SAMPLE_CAP = 5;

for (const file of walk(inputDir, flags.recurse)) {
  const ext = extname(file).toLowerCase();
  if (!SUPPORTED_EXT.has(ext)) {
    counts.skipped++;
    continue;
  }
  // Skip files already in our own output dirs (re-running on the same
  // input shouldn't re-classify what we already sorted).
  if (file.startsWith(outEquirect) || file.startsWith(outRegular)) continue;

  let meta;
  try {
    meta = await sharp(file).metadata();
  } catch (err) {
    console.warn(`  ! could not read ${basename(file)}: ${err.message ?? err}`);
    counts.errored++;
    continue;
  }
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) {
    console.warn(`  ! no dimensions for ${basename(file)} — skipping`);
    counts.skipped++;
    continue;
  }
  const aspect = w / h;
  const isEquirect =
    w >= flags.minWidth &&
    aspect >= flags.aspectMin &&
    aspect <= flags.aspectMax;

  const targetDir = isEquirect ? outEquirect : outRegular;
  const targetPath = join(targetDir, basename(file));

  if (isEquirect) counts.equirect++;
  else counts.regular++;

  if (samples[isEquirect ? "equirect" : "regular"].length < SAMPLE_CAP) {
    samples[isEquirect ? "equirect" : "regular"].push(
      `${basename(file)} (${w}×${h}, aspect ${aspect.toFixed(3)})`,
    );
  }

  if (flags.dryRun) continue;
  try {
    if (flags.move) await rename(file, targetPath);
    else await copyFile(file, targetPath);
  } catch (err) {
    console.error(
      `  ! ${flags.move ? "move" : "copy"} failed for ${basename(file)}: ${err.message ?? err}`,
    );
    counts.errored++;
  }
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

console.log("");
console.log(`equirectangular:  ${counts.equirect}`);
if (samples.equirect.length) {
  for (const s of samples.equirect) console.log(`    ${s}`);
  if (counts.equirect > SAMPLE_CAP) console.log(`    ... and ${counts.equirect - SAMPLE_CAP} more`);
}
console.log(`regular:          ${counts.regular}`);
if (samples.regular.length) {
  for (const s of samples.regular) console.log(`    ${s}`);
  if (counts.regular > SAMPLE_CAP) console.log(`    ... and ${counts.regular - SAMPLE_CAP} more`);
}
console.log(`skipped:          ${counts.skipped}  (non-image / no-dimensions)`);
if (counts.errored) console.log(`errored:          ${counts.errored}`);
if (flags.dryRun) console.log(`(dry-run — no files copied/moved)`);

const total = counts.equirect + counts.regular;
process.exit(total === 0 ? 2 : 0);

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function* walk(dir, recurse) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (recurse && ent.name !== "equirectangular" && ent.name !== "regular") {
        yield* walk(full, true);
      }
      continue;
    }
    if (ent.isFile()) yield full;
  }
}

function getArg(name) {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  return args[i + 1];
}

function printUsage() {
  console.log(`Usage: node scripts/sort-equirectangulars.mjs <input-dir> [options]

Options:
  --out <dir>           Output base dir (default: <input-dir>)
  --recurse             Walk subdirectories
  --move                Move files instead of copying (default: copy)
  --dry-run             Report what would happen without touching files
  --min-width <px>      Skip files below this width (default: 2048)
  --aspect <min..max>   Aspect-ratio window for equirect (default: 1.95..2.05)
  --help                Show this message

Examples:
  # Default: in-place sort, copy
  node scripts/sort-equirectangulars.mjs C:/path/to/folder

  # Preview without touching files
  node scripts/sort-equirectangulars.mjs C:/path/to/folder --dry-run

  # Move into a separate output tree, walk all subdirs
  node scripts/sort-equirectangulars.mjs C:/path/to/folder --out D:/sorted --recurse --move
`);
}
