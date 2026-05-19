#!/usr/bin/env node
/**
 * tests/visual/run-all.mjs — Visual regression sweep runner.
 *
 *   pnpm test:visual           # diff against baselines
 *   pnpm test:visual:update    # rewrite baselines (after intended changes)
 *
 * Walks VISUAL_TARGETS from ./config.ts, snaps each, diffs against the
 * stored baseline under __snapshots__/, prints a summary table.
 *
 * Exit codes:
 *   0  — every target passed (or was updated)
 *   1  — at least one target failed the diff
 *   2  — runner crashed (Playwright missing, dev server down, etc.)
 *
 * Required env:
 *   HOLOFLOW_BASE_URL  default http://localhost:3000
 *
 * Heads up: the script imports config.ts directly. That works because
 * package.json runs us with `node --experimental-strip-types` — a
 * built-in Node 22.6+ feature, no new dep. If you ever invoke this
 * file by hand, use the same flag or you'll get an esbuild-flavoured
 * SyntaxError on the type annotations.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { snapTarget, DIFF_TOLERANCE } from "./snap.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.HOLOFLOW_BASE_URL ?? "http://localhost:3000";
const UPDATE = process.argv.includes("--update");

async function loadConfig() {
  try {
    const mod = await import("./config.ts");
    return mod.VISUAL_TARGETS;
  } catch (err) {
    console.error("[test:visual] failed to load config.ts");
    console.error("[test:visual] error:", err?.message ?? err);
    console.error(
      "[test:visual] this script requires Node 22.6+ with " +
        "`--experimental-strip-types` (set via the package.json script).",
    );
    process.exit(2);
  }
}

async function loadPlaywright() {
  try {
    const mod = await import("playwright");
    return mod.chromium;
  } catch (err) {
    console.error("[test:visual] Playwright is not installed. Install once:");
    console.error("[test:visual]   pnpm add -D playwright");
    console.error("[test:visual]   pnpm exec playwright install chromium");
    console.error("[test:visual] underlying error:", err?.message ?? err);
    process.exit(2);
  }
}

/** Format a fraction as a percentage with one decimal, padded. */
function pct(frac) {
  if (frac === undefined || frac === null) return "    -";
  return (frac * 100).toFixed(2).padStart(5) + "%";
}

/** Best-effort terminal colour without pulling chalk. */
const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function tagFor(mode) {
  switch (mode) {
    case "pass":
      return C.green("PASS");
    case "fail":
      return C.red("FAIL");
    case "updated":
      return C.yellow("UPDT");
    case "missing-baseline":
      return C.yellow("MISS");
    case "diff-skipped":
      return C.yellow("SKIP");
    case "error":
      return C.red("ERR ");
    default:
      return C.dim(mode.padEnd(4));
  }
}

async function main() {
  const targets = await loadConfig();
  const chromium = await loadPlaywright();

  console.log(`[test:visual] base = ${BASE}`);
  console.log(`[test:visual] targets = ${targets.length}`);
  console.log(`[test:visual] mode = ${UPDATE ? "UPDATE BASELINES" : "diff"}`);
  console.log(`[test:visual] tolerance = ${(DIFF_TOLERANCE * 100).toFixed(2)}%`);
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // viewport set per-target inside snap.mjs
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    // Disable animations where the browser will respect it (prefers-reduced-motion).
    reducedMotion: "reduce",
  });

  const results = [];

  try {
    for (const target of targets) {
      const page = await context.newPage();
      let result;
      try {
        result = await snapTarget(page, target, {
          baseUrl: BASE,
          update: UPDATE,
        });
      } catch (err) {
        result = {
          target,
          stem: `${target.label}__${target.viewport.width}x${target.viewport.height}`,
          mode: "error",
          ms: 0,
          error: String(err).slice(0, 400),
          warnings: [],
        };
      } finally {
        await page.close().catch(() => {});
      }
      results.push(result);

      const tag = tagFor(result.mode);
      const route = target.route.padEnd(36);
      const viewport = `${target.viewport.width}x${target.viewport.height}`
        .padEnd(9);
      const ms = String(result.ms).padStart(5) + "ms";
      const diffStr = pct(result.diffFraction);
      const navHint = result.navError ? C.red(" nav=ERR") : "";
      console.log(`  ${tag} ${route} ${viewport} ${ms} ${diffStr}${navHint}`);
      if (result.warnings?.length) {
        for (const w of result.warnings.slice(0, 2)) {
          console.log(`        ${C.dim("warn: " + w)}`);
        }
      }
      if (result.error) {
        console.log(`        ${C.red("error: " + result.error)}`);
      }
    }
  } finally {
    // Always close the browser, even mid-loop crash.
    await browser.close().catch(() => {});
  }

  console.log();

  const failed = results.filter((r) => r.mode === "fail" || r.mode === "error");
  const missing = results.filter((r) => r.mode === "missing-baseline");
  const updated = results.filter((r) => r.mode === "updated");
  const passed = results.filter((r) => r.mode === "pass");
  const skipped = results.filter((r) => r.mode === "diff-skipped");

  console.log(`[test:visual] summary`);
  console.log(`  total   ${results.length}`);
  console.log(`  pass    ${passed.length}`);
  console.log(`  fail    ${failed.length}`);
  console.log(`  miss    ${missing.length} (no baseline yet)`);
  console.log(`  skip    ${skipped.length}`);
  console.log(`  upd     ${updated.length}`);

  if (missing.length > 0 && !UPDATE) {
    console.log();
    console.log(
      C.yellow(
        `[test:visual] ${missing.length} target(s) have no baseline yet. ` +
          `Run \`pnpm test:visual:update\` to capture them.`,
      ),
    );
    for (const m of missing.slice(0, 8)) {
      console.log(`  - ${m.target.route} (${m.target.viewport.width}x${m.target.viewport.height})`);
    }
  }

  if (failed.length > 0) {
    console.log();
    console.log(C.red(`[test:visual] failing targets:`));
    for (const f of failed) {
      const diffLine = f.diffPath
        ? ` diff=${path.relative(process.cwd(), f.diffPath)}`
        : "";
      console.log(
        `  ${f.target.route} (${f.target.viewport.width}x${f.target.viewport.height}) ` +
          `${pct(f.diffFraction)}${diffLine}`,
      );
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[test:visual] runner crashed:", err);
  process.exit(2);
});
