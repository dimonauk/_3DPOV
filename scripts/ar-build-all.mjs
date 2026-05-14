#!/usr/bin/env node
/**
 * Build AR assets for every card under data/cards/.
 * Cross-platform — invoked as `pnpm run cards:build:all`.
 *
 * Env:
 *   PUBLIC_BASE_URL — what the generated QRs encode (default: holoflow.co.uk)
 *   SKIP_MIND=1     — skip the slow MindAR compile step (faster iteration)
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";

const exec = promisify(execFile);
const root = process.cwd();
const cardsDir = path.join(root, "data", "cards");

const entries = await fs.readdir(cardsDir).catch(() => []);
const slugs = entries.filter((e) => e.endsWith(".json")).map((e) => e.replace(/\.json$/, ""));

if (slugs.length === 0) {
  console.error(`No card JSONs found under ${cardsDir}. Add one and try again.`);
  process.exit(1);
}

console.log(`Building ${slugs.length} card${slugs.length === 1 ? "" : "s"}: ${slugs.join(", ")}`);

const args = process.env.SKIP_MIND === "1" ? ["--skip-mind"] : [];

for (const slug of slugs) {
  console.log(`\n━━━ ${slug} ━━━`);
  try {
    const { stdout, stderr } = await exec("node", ["scripts/ar-build-card.mjs", slug, ...args], {
      cwd: root,
      maxBuffer: 32 * 1024 * 1024,
      env: process.env,
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (err) {
    console.error(`✗ ${slug} failed: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("\n✅ Done building all cards");
