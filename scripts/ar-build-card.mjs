#!/usr/bin/env node
/**
 * Build all AR assets for a card holder, in dependency order.
 *
 *   1. card-front.png  (procedural placeholder OR user-supplied)
 *   2. target.mind     (compiled from card-front.png by MindAR)
 *   3. model.glb       (procedural placeholder OR user-supplied)
 *   4. qr.svg          (encodes the canonical /c/<slug> URL)
 *
 * Outputs (per slug) land in:
 *   public/cards/<slug>/
 *
 * Usage:
 *   node scripts/ar-build-card.mjs <slug>
 *   node scripts/ar-build-card.mjs <slug> --skip-mind        (skip slow mind compile)
 *   node scripts/ar-build-card.mjs <slug> --force-regen-png  (overwrite existing front)
 *
 * Env:
 *   PUBLIC_BASE_URL=https://holoflow.co.uk   # what the QR encodes
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";

const exec = promisify(execFile);

const slug = process.argv[2];
const flags = new Set(process.argv.slice(3));
if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
  console.error("Usage: node scripts/ar-build-card.mjs <slug> [--skip-mind] [--force-regen-png]");
  process.exit(1);
}

const root = process.cwd();
const dir = path.join(root, "public", "cards", slug);

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function step(label, fn) {
  const t0 = Date.now();
  process.stdout.write(`\n→ ${label}\n`);
  try {
    await fn();
    console.log(`  ✓ (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    process.exit(1);
  }
}

async function runNode(script, ...args) {
  const { stdout, stderr } = await exec("node", [`scripts/${script}`, ...args], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

// 1. Card front PNG
await step("Generate card-front.png", async () => {
  const target = path.join(dir, "card-front.png");
  if (await exists(target) && !flags.has("--force-regen-png")) {
    console.log(`  (already exists — skipping. Pass --force-regen-png to overwrite.)`);
  } else {
    await runNode("ar-generate-card-front.mjs", slug);
  }
});

// 2. MindAR target (slow — 30s-2min typical)
await step("Compile target.mind", async () => {
  if (flags.has("--skip-mind")) {
    console.log("  (skipped via --skip-mind)");
    return;
  }
  await runNode("ar-compile-mind.mjs", slug);
});

// 3. GLB model (only if missing — never overwrite user content)
await step("Generate model.glb", async () => {
  const target = path.join(dir, "model.glb");
  if (await exists(target)) {
    console.log(`  (already exists — keeping. Delete file to regen placeholder.)`);
  } else {
    await runNode("ar-generate-glb.mjs", slug);
  }
});

// 4. QR code
await step("Generate qr.svg", async () => {
  await runNode("ar-generate-qr.mjs", slug);
});

console.log(`\n✅ All assets for ${slug} ready in ${dir}\n`);
