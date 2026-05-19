# Visual regression sweep

Snap every magazine and atelier surface, diff against a stored baseline, fail the run if anything shifts more than half a percent of pixels.

Lives next door to `tests/e2e/` but does a different job — the E2E sweep checks that pages load and don't throw; this one checks that they still **look right**. Run both before any push that touches CSS, design tokens, the layout primitives, or anything in `components/layout`, `components/articles`, `components/journal`, `components/tutorials`.

## What it catches

- A typo in `globals.css` that tinted every `.lux-foil` block five points warmer
- An accidentally removed Tailwind class on a magazine card
- A breaking change in `lux-*` primitives that ripples across articles
- A bumped font that shifts headlines a couple of pixels (yes, this matters — the magazine surfaces are tuned)
- A `<main>` that lost its `max-w-*` and now sprawls the whole viewport

## What it doesn't catch

- Interaction breakage — buttons that look fine but throw on click. That's the existing `pnpm test:e2e` sweep's job.
- Anything inside a `<canvas>`. We mask those. They render WebGPU/WebGL frames that vary run-to-run and would always blow the diff.
- Content drift — if the CMS swaps an image for a different image, that's a real visual change and the sweep will flag it. Which is correct: you'll be asked to either bless it (`pnpm test:visual:update`) or revert the change.

## Running

```bash
# Start the dev server in another shell first
pnpm dev

# Then run the sweep (defaults to http://localhost:3000)
pnpm test:visual

# Or point at a different port
HOLOFLOW_BASE_URL=http://localhost:3001 pnpm test:visual

# Bless current state as the new baselines (after intended visual changes)
pnpm test:visual:update
```

Artifacts land under `tests/visual/__snapshots__/`:

- `<label>__<viewport>.png` — the baseline (committed)
- `<label>__<viewport>.actual.png` — last run's actual screenshot (not committed)
- `<label>__<viewport>.diff.png` — visual diff when a target fails (not committed)

Add the actual + diff files to `.gitignore` if they aren't there already.

## Adding a new target

Open `tests/visual/config.ts` and append one row to `VISUAL_TARGETS`. Use the `pair()` helper to generate both desktop + mobile in one go:

```ts
...pair("/atelier/your-new-surface", "atelier-your-new-surface", {
  waitForSelector: "canvas, main",
  warmupMs: 1500,
  maskSelectors: [...GLOBAL_ANIMATED_MASKS, "canvas"],
}),
```

Then run `pnpm test:visual:update` once to capture the baseline, eyeball the PNGs under `__snapshots__/`, and commit.

## The warmup pattern

If a target renders a Three.js / WebGPU / Spark scene, the canvas exists but is **black** for the first frame or two. If you snap before the scene warms up, your baseline is a black square and every subsequent run that catches an actual frame will fail with 100% diff.

Two knobs:

- `waitForSelector: "canvas, main"` — wait for either selector to appear before snapping. The `canvas` alone won't help (it mounts pre-render); we use `canvas, main` so server-rendered pages also resolve.
- `warmupMs: 1500` — sit on a 1.5s timer **after** the selector resolves so the scene actually paints. Tune up if you see flakes; tune down if the sweep is slow.

The constants at the top of `config.ts` — `SCENE_WARMUP_MS` and `STATIC_WARMUP_MS` — are the studio's defaults. If a whole class of pages needs more time, change the constant rather than every row.

## The masking pattern

Animated regions blow the diff. Mask them.

```ts
maskSelectors: [...GLOBAL_ANIMATED_MASKS, "canvas", "[data-clock-pill]"],
```

`GLOBAL_ANIMATED_MASKS` already covers:

- `[data-ambient-field]` — the persistent canvas that floats behind the magazine surfaces
- `[data-visual-mask]` — escape hatch: add this attribute to any element you want masked
- `[data-clock-pill]` — corner clock chrome

The mask is painted black + child visibility hidden via in-page `page.evaluate()`. Layout stays intact, the pixel content goes to zero.

If you add a new always-animated component, give it `data-visual-mask` rather than listing the selector per-target. One source of truth.

## Tolerance

0.5% of pixels (`DIFF_TOLERANCE` in `snap.mjs`) is the studio's tuned value. Tight enough to catch a colour-token regression. Loose enough to absorb subpixel font hinting jitter from different Chromium builds. Don't raise this casually — if a target is consistently flaky above 0.5%, mask the flaky region instead.

## When it fails

1. Inspect `tests/visual/__snapshots__/<label>__<viewport>.diff.png` — red pixels are where the diff is.
2. If the change is intended: `pnpm test:visual:update`, then commit the new baseline.
3. If the change is unintended: that's why this exists. Find what regressed.

## CI

Not wired here. Playwright doesn't easily run on Vercel (no Chromium in their serverless runtime). The studio runs this locally pre-push for now. Future options:

- A self-hosted runner on Sovereign-PC that listens for branch pushes and runs the sweep
- A managed service like Chromatic or Percy — they handle the baseline storage too, which gets useful at scale
- A pre-push git hook that runs the sweep against the running dev server, blocks the push on fail

For now: just run it before you push anything CSS-shaped.
