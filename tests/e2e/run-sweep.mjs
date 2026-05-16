#!/usr/bin/env node
/**
 * tests/e2e/run-sweep.mjs — Playwright route sweep, runnable via
 *   pnpm test:e2e
 *
 * Hits every curated public route under the running dev server,
 * captures a screenshot per route, records browser console errors
 * and uncaught pageerrors, writes per-route results to JSON.
 *
 * Assumes a dev server is already running. Reads HOLOFLOW_BASE_URL
 * from the environment (defaults to http://localhost:3000) — set
 * HOLOFLOW_BASE_URL=http://localhost:3001 etc when port differs.
 *
 * Exits 0 if every route returns 2xx AND no pageerror fires.
 * Exits 1 otherwise. Output JSON + screenshots are written
 * regardless of pass/fail so the next iteration has something to
 * look at.
 *
 * To extend: edit the ROUTES list in tests/e2e/routes.mjs.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.resolve(__dirname, "artifacts");
const BASE = process.env.HOLOFLOW_BASE_URL ?? "http://localhost:3000";

// Lazy-import so a missing Playwright install gives a clear error
// instead of crashing in the shebang.
async function loadPlaywright() {
  try {
    const mod = await import("playwright");
    return mod.chromium;
  } catch (err) {
    console.error(
      "[test:e2e] Playwright is not installed. Install it once:",
    );
    console.error("[test:e2e]   pnpm add -D playwright");
    console.error("[test:e2e]   pnpm exec playwright install chromium");
    console.error("[test:e2e] underlying error:", err);
    process.exit(2);
  }
}

import { ROUTES } from "./routes.mjs";

async function main() {
  const chromium = await loadPlaywright();
  await mkdir(ARTIFACTS, { recursive: true });

  console.log(`[test:e2e] base = ${BASE}`);
  console.log(`[test:e2e] routes = ${ROUTES.length}`);
  console.log(`[test:e2e] artifacts = ${ARTIFACTS}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const results = [];

  for (const { path: urlPath, slug } of ROUTES) {
    const page = await context.newPage();
    const consoleErrors = [];
    const consoleWarnings = [];
    const pageErrors = [];

    page.on("console", (msg) => {
      const text = msg.text().slice(0, 800);
      if (msg.type() === "error") consoleErrors.push(text);
      if (msg.type() === "warning") consoleWarnings.push(text);
    });
    page.on("pageerror", (err) => {
      pageErrors.push(String(err).slice(0, 800));
    });

    const url = BASE + urlPath;
    const t0 = Date.now();
    let status = null;
    let navError = null;

    try {
      const resp = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      if (resp) status = resp.status();
      try {
        await page.waitForLoadState("networkidle", { timeout: 15_000 });
      } catch {
        // SPA / WebSocket pages don't idle — proceed anyway
      }
    } catch (err) {
      navError = String(err).slice(0, 500);
    }

    const ms = Date.now() - t0;

    try {
      await page.screenshot({
        path: path.join(ARTIFACTS, `${slug}.png`),
        fullPage: false,
        timeout: 15_000,
      });
    } catch {
      // Screenshot failure is a route problem, not a test crash
    }

    const r = {
      path: urlPath,
      slug,
      status,
      loadMs: ms,
      navError,
      pageErrors,
      consoleErrors,
      consoleWarnings: consoleWarnings.slice(0, 5),
    };
    results.push(r);

    const tag = pageErrors.length || consoleErrors.length || status !== 200
      ? "FAIL"
      : "ok  ";
    console.log(
      `  ${tag} ${urlPath.padEnd(40)} -> ${String(status).padStart(3)} ` +
        `${String(ms).padStart(5)}ms err=${consoleErrors.length} ` +
        `warn=${consoleWarnings.length} pageerr=${pageErrors.length}`,
    );

    await page.close();
  }

  await browser.close();
  await writeFile(
    path.join(ARTIFACTS, "_results.json"),
    JSON.stringify(results, null, 2),
  );

  const fails = results.filter(
    (r) => r.status !== 200 || r.pageErrors.length > 0,
  );
  console.log(`[test:e2e] total=${results.length} fails=${fails.length}`);

  if (fails.length > 0) {
    console.log("[test:e2e] failing routes:");
    for (const f of fails) {
      console.log(`  ${f.path}  status=${f.status}  pageerr=${f.pageErrors.length}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[test:e2e] runner crashed:", err);
  process.exit(2);
});
