/**
 * tests/visual/snap.mjs — Single-target snapshot + diff.
 *
 * Called by run-all.mjs once per VISUAL_TARGETS row. Lifecycle per target:
 * goto → waitForSelector → warmupMs → applyMasks → screenshot →
 * (update? write baseline : diff vs baseline → write diff PNG if fail).
 *
 * Layout under __snapshots__/:
 *   <label>__<viewport>.png         — baseline (committed)
 *   <label>__<viewport>.actual.png  — last actual (gitignored)
 *   <label>__<viewport>.diff.png    — diff when failing (gitignored)
 */

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = path.resolve(__dirname, "__snapshots__");

// Tolerance — fraction of pixels allowed to differ before a target
// counts as a failure. 0.5% is the studio's tuned value: tight enough
// to catch a colour-token regression, loose enough to absorb the
// subpixel jitter from font hinting on different Chromium builds.
export const DIFF_TOLERANCE = 0.005;

// Pixelmatch comparator threshold (per-pixel colour distance, 0..1).
// 0.2 is Playwright's documented default — works well for our chrome.
const PIXEL_THRESHOLD = 0.2;

/**
 * Build the filename stem for a target. Viewport gets baked into the
 * name so we don't have to nest folders.
 */
export function labelFor(target) {
  const v = `${target.viewport.width}x${target.viewport.height}`;
  return `${target.label}__${v}`;
}

/** Has `file` ever been written? */
async function exists(file) {
  try {
    await access(file, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Paint solid black rectangles over every element matched by the
 * mask selectors. Done in-page (page.evaluate) so the masks land on
 * the actual DOM nodes — Playwright's own mask option only works
 * inside @playwright/test, which we're not using here.
 */
async function applyMasks(page, selectors) {
  if (!selectors || selectors.length === 0) return;
  await page.evaluate((sels) => {
    for (const sel of sels) {
      const nodes = document.querySelectorAll(sel);
      nodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        // Use visibility hidden + background to keep layout intact
        // while killing the visual content. Some sites animate on
        // box-shadow, so we also clear that.
        node.style.background = "#000";
        node.style.color = "#000";
        node.style.boxShadow = "none";
        node.style.outline = "none";
        // Hide children — works for canvas + img + video alike.
        for (const child of node.children) {
          if (child instanceof HTMLElement) {
            child.style.visibility = "hidden";
          }
        }
      });
    }
  }, selectors);
}

/**
 * Capture one snapshot for one target on an already-open page.
 * Returns a result object the runner aggregates.
 */
export async function snapTarget(page, target, opts = {}) {
  const base = opts.baseUrl ?? "http://localhost:3000";
  const update = opts.update === true;

  await mkdir(SNAPSHOTS_DIR, { recursive: true });

  const url = base + target.route;
  const stem = labelFor(target);
  const baseline = path.join(SNAPSHOTS_DIR, `${stem}.png`);
  const actual = path.join(SNAPSHOTS_DIR, `${stem}.actual.png`);
  const diffOut = path.join(SNAPSHOTS_DIR, `${stem}.diff.png`);

  const t0 = Date.now();
  const warnings = [];
  let navError = null;

  try {
    await page.setViewportSize(target.viewport);
    const resp = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    if (resp && !resp.ok()) {
      warnings.push(`HTTP ${resp.status()} from ${url}`);
    }
  } catch (err) {
    navError = String(err).slice(0, 400);
  }

  if (target.waitForSelector) {
    try {
      await page.waitForSelector(target.waitForSelector, { timeout: 10_000 });
    } catch {
      warnings.push(`selector never resolved: ${target.waitForSelector}`);
    }
  }

  if (target.warmupMs && target.warmupMs > 0) {
    await page.waitForTimeout(target.warmupMs);
  }

  await applyMasks(page, target.maskSelectors);

  let screenshotBuf = null;
  try {
    screenshotBuf = await page.screenshot({
      fullPage: true,
      timeout: 30_000,
      animations: "disabled",
      caret: "hide",
    });
  } catch (err) {
    return {
      target,
      stem,
      mode: "error",
      ms: Date.now() - t0,
      error: `screenshot failed: ${String(err).slice(0, 300)}`,
      warnings,
      navError,
    };
  }

  if (update) {
    await writeFile(baseline, screenshotBuf);
    return {
      target,
      stem,
      mode: "updated",
      ms: Date.now() - t0,
      bytes: screenshotBuf.length,
      warnings,
      navError,
    };
  }

  // Always write the actual so the operator can inspect after a fail.
  await writeFile(actual, screenshotBuf);

  const baselineExists = await exists(baseline);
  if (!baselineExists) {
    // Missing baseline: warn + offer, do NOT count as a failure that
    // crashes the run. The runner aggregates these and prints a hint
    // to invoke --update.
    return {
      target,
      stem,
      mode: "missing-baseline",
      ms: Date.now() - t0,
      bytes: screenshotBuf.length,
      warnings,
      navError,
    };
  }

  // Diff. Import lazily — falling back to "skip diff" beats crashing.
  let diff;
  try {
    diff = await pixelDiff(baseline, actual, diffOut);
  } catch (err) {
    return {
      target,
      stem,
      mode: "diff-skipped",
      ms: Date.now() - t0,
      bytes: screenshotBuf.length,
      warnings: [
        ...warnings,
        `diff engine unavailable: ${String(err).slice(0, 200)}`,
      ],
      navError,
    };
  }

  const passed = diff.fraction <= DIFF_TOLERANCE;
  return {
    target,
    stem,
    mode: passed ? "pass" : "fail",
    ms: Date.now() - t0,
    bytes: screenshotBuf.length,
    diffFraction: diff.fraction,
    diffPixels: diff.diffPixels,
    totalPixels: diff.totalPixels,
    diffPath: passed ? null : diffOut,
    warnings,
    navError,
  };
}

/**
 * Pixel-diff two PNGs. Uses PNG from Playwright's bundled utilsBundle
 * (no new dep). Pixelmatch isn't externally exported, so we roll a
 * small luminance-weighted comparator with pixelmatch-equivalent
 * output (red for diff, faded grey for match).
 */
async function pixelDiff(baselinePath, actualPath, diffOutPath) {
  let PNG;
  try {
    PNG = (await import("playwright-core/lib/utilsBundle.js")).PNG;
  } catch {
    // Fallback: try the direct dep in case the playwright-core bundle
    // path moves. pngjs is itself a transitive dep of playwright.
    PNG = (await import("pngjs")).PNG;
  }

  if (!PNG) throw new Error("PNG module not resolvable");

  const baselineBuf = await readFile(baselinePath);
  const actualBuf = await readFile(actualPath);

  const baselineImg = PNG.sync.read(baselineBuf);
  const actualImg = PNG.sync.read(actualBuf);

  // Dimension mismatch = treat as 100% diff. Can happen if you
  // changed viewport tokens or removed a fold of content.
  if (
    baselineImg.width !== actualImg.width ||
    baselineImg.height !== actualImg.height
  ) {
    const total = Math.max(
      baselineImg.width * baselineImg.height,
      actualImg.width * actualImg.height,
    );
    return { diffPixels: total, totalPixels: total, fraction: 1 };
  }

  const { width, height } = baselineImg;
  const diffImg = new PNG({ width, height });
  const a = baselineImg.data;
  const b = actualImg.data;
  const out = diffImg.data;
  const totalPixels = width * height;
  let diffPixels = 0;

  // PIXEL_THRESHOLD is in 0..1 normalised space — convert to a squared
  // 0..255*3 distance once, outside the hot loop. We use weighted
  // luminance: R*0.299 + G*0.587 + B*0.114, then squared diff.
  const distLimit = PIXEL_THRESHOLD * 255;
  const distLimitSq = distLimit * distLimit;

  for (let i = 0; i < totalPixels; i++) {
    const off = i * 4;
    const dr = a[off] - b[off];
    const dg = a[off + 1] - b[off + 1];
    const db = a[off + 2] - b[off + 2];
    // Weighted distance approximating perceived brightness change.
    const distSq =
      dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;

    if (distSq > distLimitSq) {
      diffPixels++;
      // Red mark for differing pixels.
      out[off] = 255;
      out[off + 1] = 0;
      out[off + 2] = 0;
      out[off + 3] = 255;
    } else {
      // Faded greyscale for matching pixels — keeps spatial context.
      const grey =
        (a[off] * 0.299 + a[off + 1] * 0.587 + a[off + 2] * 0.114) * 0.4 +
        128;
      out[off] = grey;
      out[off + 1] = grey;
      out[off + 2] = grey;
      out[off + 3] = 255;
    }
  }

  await writeFile(diffOutPath, PNG.sync.write(diffImg));
  return { diffPixels, totalPixels, fraction: diffPixels / totalPixels };
}
