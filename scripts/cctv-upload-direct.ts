#!/usr/bin/env tsx
/**
 * cctv-upload-direct.ts — Upload the 20-most-recent _std.ply files to
 * Vercel Blob + write Firestore records.
 *
 * Bench-side companion to `cctv-upload-existing-splats.ts`. The
 * difference: this script imports `@vercel/blob` and `firebase-admin`
 * directly, sidestepping the lib/capabilities/media/library.ts surface
 * (which uses `import "server-only"` — Next's build-time guard that
 * throws under tsx).
 *
 * Limited to the most recent N _std.ply files by default. Each upload
 * costs Vercel Blob storage + future visitor egress, so start small.
 *
 * Env required (pull via `vercel env pull .env.local` first):
 *   FIREBASE_ADMIN_SERVICE_ACCOUNT
 *   BLOB_READ_WRITE_TOKEN (or PRIVATE_BLOB_READ_WRITE_TOKEN)
 *
 * Run:
 *   pnpm exec tsx scripts/cctv-upload-direct.ts --limit 5 --dry-run
 *   pnpm exec tsx scripts/cctv-upload-direct.ts --limit 20
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { argv, env, exit, stderr, stdout } from "node:process";

import { config as dotenvConfig } from "dotenv";
import { put } from "@vercel/blob";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load .env.local first so process.env carries the Vercel-pulled secrets.
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

const STAGING_DIR = "scripts/cctv-staging";

type Flags = {
  limit: number | null;
  dryRun: boolean;
};

function parseFlags(args: string[]): Flags {
  let limit: number | null = null;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--limit" && args[i + 1]) {
      const n = Number.parseInt(args[++i] ?? "", 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    }
  }
  return { limit, dryRun };
}

function locationTitle(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function findStdPlys(): Promise<Array<{ path: string; slug: string; mtime: number }>> {
  const entries = await readdir(STAGING_DIR, { withFileTypes: true });
  const results: Array<{ path: string; slug: string; mtime: number }> = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const dir = join(STAGING_DIR, e.name);
    let dirEntries: string[];
    try {
      dirEntries = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of dirEntries) {
      if (!name.endsWith("_std.ply")) continue;
      const full = join(dir, name);
      const s = await stat(full);
      results.push({ path: full, slug: e.name, mtime: s.mtimeMs });
    }
  }
  // Newest first — we typically want the freshest results visible.
  results.sort((a, b) => b.mtime - a.mtime);
  return results;
}

function getBlobToken(): string {
  // .env.local from `vercel env pull` is UTF-8 with a BOM, which dotenv
  // leaks into the first parsed value. Strip it before handing the token
  // to fetch (which rejects non-ByteString characters in headers).
  // Prefer the *public* store token — `PRIVATE_BLOB_…` is bound to a
  // private store that rejects `access: "public"`, and the
  // /research/cctv-3d-archive surface needs the splat URL to be
  // resolvable by the browser without a signing round-trip.
  const stripBom = (s: string) => s.replace(/^﻿/, "");
  const pub = env.BLOB_READ_WRITE_TOKEN;
  if (pub && pub.length > 0) return stripBom(pub);
  const priv = env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  if (priv && priv.length > 0) return stripBom(priv);
  throw new Error(
    "no Vercel Blob token in env — `vercel env pull .env.local` first",
  );
}

function getFirestoreDb() {
  const raw = env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT not set — `vercel env pull .env.local` first",
    );
  }
  // `vercel env pull` writes a UTF-8 BOM at the start of the value, and
  // dotenv then expands `\n` escapes inside the Firebase service-account
  // JSON to real newlines — including the ones inside the private_key
  // string literal, which JSON.parse rejects. Strip the BOM, then escape
  // real newlines/tabs only when they fall *inside* a JSON string (real
  // newlines between tokens are valid JSON whitespace and must be left
  // alone).
  const withoutBom = raw.replace(/^﻿/, "").trim();
  const cleaned = withoutBom.replace(
    /"((?:[^"\\]|\\.)*)"/g,
    (_match, body: string) => {
      const escaped = body
        .replace(/\r\n?/g, "\\n")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t");
      return `"${escaped}"`;
    },
  );
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const projectId = String(parsed["project_id"] ?? "");
  const clientEmail = String(parsed["client_email"] ?? "");
  const privateKey = String(parsed["private_key"] ?? "").replace(
    /\\n/g,
    "\n",
  );
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT missing fields");
  }
  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
  return getFirestore(app);
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function uploadOne(
  filePath: string,
  slug: string,
  token: string,
  db: ReturnType<typeof getFirestoreDb>,
): Promise<{ url: string; bytes: number }> {
  const bytes = await readFile(filePath);
  const filename = basename(filePath);
  const blobPath = `media/${slug}/${filename}`;

  const blob = await put(blobPath, bytes, {
    access: "public",
    token,
    contentType: "application/octet-stream",
    addRandomSuffix: true,
  });

  const title = locationTitle(slug);
  const mediaId = randomUUID();
  await db
    .collection("media")
    .doc(mediaId)
    .set({
      id: mediaId,
      kind: "ply",
      subject: "research",
      source: "vercel-blob",
      url: blob.url,
      mimeType: "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "bench-script:dimonauk@gmail.com",
      title,
      description: `CCTV still from ${title}, lifted into a 3D Gaussian Splat by Apple SHARP via ONNX on the studio bench.`,
      tags: ["cctv", "sharp-onnx", "london"],
      location: { slug, name: title },
      sizeBytes: bytes.length,
      sha256: sha256Hex(new Uint8Array(bytes)),
      sourceRef: {
        blob: { pathname: blob.pathname },
        splat: {
          provider: "sharp-onnx",
          licence: "research-only",
          plyFlavour: "standard-3dgs",
          gaussianCount: 1_179_648,
        },
      },
      variants: { original: blob.url },
    });

  return { url: blob.url, bytes: bytes.length };
}

async function main(): Promise<number> {
  const flags = parseFlags(argv.slice(2));
  const all = await findStdPlys();
  const targets = flags.limit !== null ? all.slice(0, flags.limit) : all;
  stdout.write(
    `Found ${all.length} _std.ply files; ${targets.length} to upload.\n`,
  );

  if (flags.dryRun) {
    for (const t of targets) stdout.write(`  would upload: ${t.path}\n`);
    return 0;
  }

  let token: string;
  let db: ReturnType<typeof getFirestoreDb>;
  try {
    token = getBlobToken();
    db = getFirestoreDb();
  } catch (err) {
    stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }

  let ok = 0;
  let fail = 0;
  for (const t of targets) {
    try {
      const sizeMB = (await stat(t.path)).size / 1024 / 1024;
      stdout.write(
        `  ${locationTitle(t.slug)} (${sizeMB.toFixed(0)} MB)…`,
      );
      const r = await uploadOne(t.path, t.slug, token, db);
      stdout.write(` → ${r.url}\n`);
      ok++;
    } catch (err) {
      stderr.write(
        `\n  FAILED ${t.path}: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      fail++;
    }
  }
  stdout.write(`\nDone — ${ok} uploaded, ${fail} failed.\n`);
  return fail === 0 ? 0 : 2;
}

void main().then((code) => exit(code));
