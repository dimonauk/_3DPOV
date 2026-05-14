#!/usr/bin/env tsx
/**
 * cctv-upload-existing-splats.ts
 *
 * One-off bench tool: walks `scripts/cctv-staging/<location>/*_std.ply`,
 * uploads each `_std.ply` to Vercel Blob and writes a Firestore Media
 * record so the splat lands on `/research/cctv-3d-archive`. Skips
 * scenes that already have a record (deduped by `sourceRef.blob.pathname`
 * proxy — uses sha256 in practice via mediaUpload).
 *
 * Use this when the splats are already on disk (e.g. after a bench
 * `batch_cctv.py` run + `convert_sharp_ply.py --batch`) and you want to
 * promote them to the public surface without re-running inference.
 *
 * Requires the same env as the site:
 *   FIREBASE_ADMIN_SERVICE_ACCOUNT  — JSON service-account
 *   BLOB_READ_WRITE_TOKEN           — Vercel Blob
 *
 * Run:
 *   pnpm exec tsx scripts/cctv-upload-existing-splats.ts
 *   pnpm exec tsx scripts/cctv-upload-existing-splats.ts --dry-run
 *   pnpm exec tsx scripts/cctv-upload-existing-splats.ts --limit 5
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { argv, env, exit, stderr, stdout } from "node:process";

import { mediaUpload } from "../lib/capabilities/media/library";

type CliFlags = {
  stagingDir: string;
  dryRun: boolean;
  limit: number | null;
};

function parseFlags(args: string[]): CliFlags {
  let stagingDir = "scripts/cctv-staging";
  let dryRun = false;
  let limit: number | null = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--staging" && args[i + 1]) {
      stagingDir = args[++i] ?? stagingDir;
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--limit" && args[i + 1]) {
      const n = Number.parseInt(args[++i] ?? "", 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    }
  }
  return { stagingDir, dryRun, limit };
}

async function listLocationDirs(stagingDir: string): Promise<string[]> {
  const entries = await readdir(stagingDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => join(stagingDir, e.name))
    .sort();
}

async function findStdPly(locationDir: string): Promise<string | null> {
  try {
    const entries = await readdir(locationDir);
    for (const name of entries.sort()) {
      if (name.endsWith("_std.ply")) {
        return join(locationDir, name);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function locationSlug(locationDir: string): string {
  return basename(locationDir);
}

function locationTitle(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function uploadOne(plyPath: string, locationDir: string): Promise<void> {
  const slug = locationSlug(locationDir);
  const title = locationTitle(slug);
  const bytes = new Uint8Array(await readFile(plyPath));
  const stats = await stat(plyPath);

  stdout.write(
    `  uploading ${title}  (${Math.round(stats.size / 1024 / 1024)} MB)…\n`,
  );

  const media = await mediaUpload({
    file: bytes,
    filename: basename(plyPath),
    mimeType: "application/octet-stream",
    kind: "ply",
    subject: "research",
    uploadedBy: "bench-script:dimonauk@gmail.com",
    title,
    location: { slug, name: title },
    description: `CCTV still from ${title}, lifted into a 3D Gaussian Splat by Apple SHARP via ONNX on the studio bench.`,
    tags: ["cctv", "sharp-onnx", "london"],
    sourceRef: {
      splat: {
        provider: "sharp-onnx",
        licence: "research-only",
        plyFlavour: "standard-3dgs",
        gaussianCount: 1_179_648,
      },
    },
  });

  stdout.write(`    → ${media.url}\n`);
}

async function main(): Promise<number> {
  const flags = parseFlags(argv.slice(2));
  if (!env["FIREBASE_ADMIN_SERVICE_ACCOUNT"]) {
    stderr.write(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT not set; cannot write Firestore.\n",
    );
    return 1;
  }
  if (!env["BLOB_READ_WRITE_TOKEN"]) {
    stderr.write(
      "BLOB_READ_WRITE_TOKEN not set; cannot upload to Vercel Blob.\n",
    );
    return 1;
  }

  const locations = await listLocationDirs(flags.stagingDir);
  stdout.write(
    `Found ${locations.length} location dirs under ${flags.stagingDir}\n`,
  );

  let processed = 0;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const loc of locations) {
    if (flags.limit !== null && processed >= flags.limit) break;
    const ply = await findStdPly(loc);
    if (!ply) {
      stdout.write(`  ${relative(flags.stagingDir, loc)}: no _std.ply yet\n`);
      skipped++;
      continue;
    }
    processed++;
    if (flags.dryRun) {
      stdout.write(`  dry-run: would upload ${ply}\n`);
      continue;
    }
    try {
      await uploadOne(ply, loc);
      uploaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stderr.write(`  FAILED ${loc}: ${message}\n`);
      failed++;
    }
  }

  stdout.write(
    `\nDone — ${uploaded} uploaded, ${skipped} skipped (no _std.ply), ${failed} failed.\n`,
  );
  return failed === 0 ? 0 : 2;
}

void main().then((code) => exit(code));
