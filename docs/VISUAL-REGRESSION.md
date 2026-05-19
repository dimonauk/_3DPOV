# Visual regression — how the studio guards its surfaces

The Holoflow Studio site has grown a lot of bespoke chrome: the `lux-*` primitives, `.lux-foil` finishes, `AmbientField`, `MeshText3D`, the magazine card grids, the atelier scene wrappers. None of it is rendered by a generic component library — every surface is hand-tuned and easy to break with a one-line CSS edit somewhere unrelated.

TypeScript catches "you broke the type contract". The existing E2E sweep (`pnpm test:e2e`) catches "the page threw on load". Neither catches "the page still loads, still types, but everything is now slightly wrong colour and the masthead is two pixels off".

That's the gap this fills.

## What this is

A Playwright-driven snapshot diff that walks `tests/visual/config.ts`, navigates to each route at two viewports (desktop 1440×900 + mobile 375×812), screenshots the full page, and diffs against a baseline stored in the repo. Pixel-diff exceeding **0.5% of total pixels** fails the run.

Lives in `tests/visual/`. Invoked via:

```bash
pnpm test:visual          # diff against baselines
pnpm test:visual:update   # bless current state as new baselines
```

Requires a running dev server (default `http://localhost:3000`, override with `HOLOFLOW_BASE_URL`).

## Why this matters

The magazine surfaces — `/articles`, `/journal`, `/tutorials`, `/whoswho`, `/news`, `/feed`, `/codex` — share a stack of layout primitives. A regression in `components/layout` or a stray Tailwind class change ripples across all of them at once. Catching that visually is fast; catching it by eye across 14 pages × 2 viewports is not.

The atelier surfaces — `/atelier/material-library`, `/atelier/postprocess-lab`, `/atelier/scene-stage-demo`, `/atelier/sculpture-gallery`, `/atelier/splat-walk` — share the SceneStage wiring. A regression in `lib/scene-stage` or the WebGPU TSL post chain looks identical to the type-checker but very different on screen.

Both categories are covered. Two viewports per target × 14 targets = 28 snapshots per sweep.

## Threshold philosophy

**0.5% pixel diff tolerance.** Tuned for the studio.

- Tight enough that a one-token colour change in `globals.css` reliably trips the sweep on the surfaces that use that token.
- Loose enough that subpixel font hinting across different Chromium builds (the studio's local Chrome vs a teammate's vs an eventual CI runner) doesn't false-positive.
- Loose enough that small animated jitter on un-masked regions doesn't trip — but in practice we mask the animated regions outright (see below), so this margin is rarely consumed.

If you find yourself raising the tolerance to make a flaky target pass, **don't.** Either mask the flaky region (see "Masking strategy" below) or fix the actual animation that's bleeding through.

## Masking strategy

Animated content has run-to-run variance that will eat your 0.5% budget alive. We mask any element that animates:

- **`canvas`** on all atelier surfaces. The WebGPU/WebGL scene inside is the whole point of the page but it's also a moving target — `applyMasks()` paints it solid black before screenshot so the diff only sees the chrome around the scene.
- **`[data-ambient-field]`** — the persistent ambient canvas that drifts behind several magazine surfaces.
- **`[data-clock-pill]`** — the timestamp pill in the corner of some pages.
- **`[data-visual-mask]`** — escape-hatch attribute. Stick it on any element you want excluded from the diff. One source of truth, no per-target list maintenance.

The mask is applied in-page via `page.evaluate()` — we set `background: #000`, `visibility: hidden` on children, etc. The element stays in flow (so the layout around it doesn't shift), but the visual content goes to zero.

This means the sweep is **explicitly NOT testing** that the canvas inside SceneStage renders the right thing. It tests that the **chrome around** SceneStage is unchanged. The scene's correctness is your eyeball's job.

## What's covered

Routes:

| Category   | Route                                |
|------------|--------------------------------------|
| Front door | `/`                                  |
| Magazine   | `/articles` `/journal` `/tutorials` `/whoswho` `/news` `/feed` `/codex` |
| Atelier    | `/atelier/material-library` `/atelier/postprocess-lab` `/atelier/scene-stage-demo` `/atelier/sculpture-gallery` `/atelier/splat-walk` |
| Catalogue  | `/splats`                            |

Viewports per route: desktop (1440×900) + mobile (375×812). 14 routes × 2 = 28 snapshots per sweep.

To extend: append rows in `tests/visual/config.ts`. The `pair()` helper generates both viewport rows from one declaration.

## What's not covered (intentionally)

- **Dynamic routes** (`/articles/[slug]`, `/codex/[slug]`, `/atelier/splat-walk/[slug]`). The index pages they live under ARE covered. Per-entry pages would multiply the snapshot count without proportional coverage gain.
- **Auth-walled routes** (`/admin/*`, `/signin/callback`). Same as the E2E sweep.
- **Interaction states.** A hover effect, a modal open, a tab switch — all out of scope for snapshot regression. Add a real Playwright test if you need to lock those down.

## File layout

```
tests/visual/
  config.ts              — typed list of targets
  snap.mjs               — single-target snap + diff (per-target work)
  run-all.mjs            — sweep driver, CLI entry point
  README.md              — workshop-side notes for whoever's running it
  __snapshots__/
    <label>__<viewport>.png         — baseline (committed)
    <label>__<viewport>.actual.png  — last actual (gitignored)
    <label>__<viewport>.diff.png    — diff PNG when failing (gitignored)
```

Add `tests/visual/__snapshots__/*.actual.png` and `tests/visual/__snapshots__/*.diff.png` to `.gitignore`.

## Run cadence

- **Before any push that touches CSS, design tokens, layout primitives, magazine components, or atelier components.** Local pre-push, manual for now.
- **When opening a PR that adds a new surface**, add a row to `config.ts` and run `pnpm test:visual:update` to capture the baseline in the same PR.
- **Weekly-ish on `main`** as a sanity check, especially after Next.js / React / Three.js upgrades.

## CI integration thoughts (not wired)

Playwright doesn't run on Vercel's serverless runtime — no Chromium binary. Options when this graduates from local-only:

1. **Self-hosted runner on Sovereign-PC.** Cleanest fit for the studio's existing infrastructure. A small webhook that pulls `claude/skeleton-build` on push, runs the sweep against a local dev server, posts results to the PR.
2. **Chromatic or Percy.** Managed snapshot services. They handle the baseline storage too, which becomes useful at scale — committing 28 PNGs per sweep gets tedious.
3. **Git pre-push hook.** Cheapest. Just refuse to push if `pnpm test:visual` is failing against `localhost:3000`. Trade-off is everyone needs the dev server running.

Right now: local-only. The studio runs it manually before pushes to surfaces it knows are risky.

## Internals — how the diff works

`snap.mjs` uses `PNG` from Playwright's bundled utils (no new dep). For each pixel:

1. Compute weighted RGB distance using the standard luminance weights (0.299R + 0.587G + 0.114B).
2. If the squared distance exceeds the threshold (≈ 0.2 normalised), the pixel counts as different.
3. Differing pixels are painted **red** in the diff PNG, matching pixels are faded greyscale — same convention as `pixelmatch` so reviewer habits carry over.
4. Pass/fail is the fraction of differing pixels vs total, compared against `DIFF_TOLERANCE` (0.005).

If dimensions mismatch (you changed viewport tokens or removed a fold of content), the whole image counts as different — i.e. 100% diff, immediate fail.

The reason we roll our own diff instead of importing `pixelmatch` directly: pixelmatch isn't an external export of `playwright-core`, only PNG is. Re-implementing the per-pixel comparison in 20 lines of plain JS is cheaper than adding a new dep. Algorithmic behaviour matches pixelmatch closely enough that the diff PNGs are visually equivalent.

## Why config.ts and not config.mjs

The targets are a typed data structure with non-trivial optional fields. TypeScript catches typos in selectors, viewport dimensions, label collisions. The runner is `.mjs` because Playwright + Node integration is simpler there; the runner imports `config.ts` via Node's built-in `--experimental-strip-types` (Node 22.6+, no extra dep). The `package.json` scripts pass the flag for you.

If you ever invoke `tests/visual/run-all.mjs` by hand without going through `pnpm test:visual`, remember to add `--experimental-strip-types` yourself or Node will throw on the type annotations in `config.ts`.
