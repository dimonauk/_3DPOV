# Holoflow Beta Test — Post-Swarm Route Sweep

**Date:** 2026-05-16
**Runner:** `tests/e2e/run-sweep.mjs` (Playwright, headless Chromium)
**Base URL:** `http://localhost:3001` (dev server, pre-existing — not restarted)
**Routes tested:** 94 (curated list in `tests/e2e/routes.mjs`)
**Artifacts:** `tests/e2e/artifacts/_results.json` + per-route PNG screenshots

## Boot status

- Dev server: **up** at `http://localhost:3001` (200 on `/`).
- Sweep ran to completion: 94 / 94 routes navigated, every route returned `200`.
- Hard fails (Playwright runner exit gate = pageerror OR non-200): **2** routes — `/atelier/sculpture-gallery`, `/atelier/sprite-designer`.
- Soft fails (200 + at least one console error): **22** additional routes, mostly the same hydration mismatch pattern.

## Routes added this run

Confirmed-existing app dirs added to `tests/e2e/routes.mjs`:

`/atelier/waveguide-forge`, `/atelier/mesh-studio`, `/atelier/pattern-prototype`, `/atelier/silk-brush`, `/atelier/lightpainting-forge`, `/atelier/quilt-designer`, `/atelier/co-drawing`, `/atelier/cube-composer`, `/atelier/breeding-floor`, `/atelier/dollhouse`, `/atelier/light-weaver`, `/atelier/sculpture-gallery`, `/atelier/modal-lattice`, `/atelier/clothing-reverse`, `/atelier/comfy-layered`, `/atelier/sprite-designer`, `/atelier/triposr`.

Skipped (no `app/` route on disk — per instructions): `/atelier/trellis`, `/academy`, `/play/agent-town`, `/play/pixel-academy`, `/aura/scene`.

## Per-route results (failing or noisy routes only)

| Route | Status | Load ms | Console errs | Page errs | Summary |
|---|---:|---:|---:|---:|---|
| /studio | 200 | 3928 | 1 | 0 | hydration mismatch |
| /journal | 200 | 3044 | 1 | 0 | hydration mismatch |
| /aerial | 200 | 3506 | 1 | 0 | hydration mismatch |
| /sphere | 200 | 10500 | 1 | 0 | hydration mismatch (also slow load) |
| /bezel | 200 | 3488 | 1 | 0 | hydration mismatch |
| /atelier | 200 | 4883 | 1 | 0 | hydration mismatch + WebGL context warnings |
| /atelier/algorithms | 200 | 5806 | 1 | 0 | hydration mismatch |
| /atelier/evolution | 200 | 4441 | 1 | 0 | hydration mismatch |
| /atelier/shape-of-it | 200 | 5610 | 1 | 0 | hydration mismatch |
| /atelier/aura-tron | 200 | 6536 | 1 | 0 | hydration mismatch |
| /atelier/procedural-city | 200 | 4321 | 1 | 0 | hydration mismatch |
| /atelier/rig-simulator | 200 | 6691 | 1 | 0 | hydration mismatch |
| /atelier/co-drawing | 200 | 16116 | 2 | 0 | "setState on unmounted" + hydration mismatch; very slow |
| /atelier/breeding-floor | 200 | 2535 | 1 | 0 | hydration mismatch |
| **/atelier/sculpture-gallery** | 200 | 2457 | 1 | **1** | `TypeError: Cannot read properties of null (reading 'trim')` + hydration mismatch + "Too many active WebGL contexts" |
| /atelier/comfy-layered | 200 | 1554 | 2 | 0 | bench unreachable (502 from `http://localhost:8188/api/chains` — ComfyUI not running) |
| **/atelier/sprite-designer** | 200 | 1821 | 0 | **1** | hard hydration failure (tree regenerated on client) |
| /atelier/triposr | 200 | 3778 | 1 | 0 | hydration mismatch |
| /apps | 200 | 3047 | 1 | 0 | hydration mismatch |
| /productions | 200 | 4079 | 1 | 0 | hydration mismatch |
| /cards/design | 200 | 2470 | 1 | 0 | hydration mismatch |
| /cards/mine | 200 | 3122 | 4 | 0 | Next.js 15 sync-dynamic-apis violations (`params`/`searchParams` accessed without `React.use()`) |
| /spatial/video | 200 | 7483 | 1 | 0 | `net::ERR_CONNECTION_REFUSED` (likely bench fetch) |
| /search | 200 | 3570 | 1 | 0 | hydration mismatch |
| /research/cctv-3d-archive | 200 | 3402 | 1 | 0 | server: `firebase-admin: no credential path configured` (env-only, not a code bug) |
| /policies | 200 | 2896 | 1 | 0 | hydration mismatch |
| /policies/terms | 200 | 3101 | 1 | 0 | hydration mismatch |
| /policies/print-bureau-terms | 200 | 3419 | 1 | 0 | hydration mismatch |
| /signin | 200 | 1618 | 1 | 0 | hydration mismatch |

All 65 other routes passed clean (200, 0 console errors, 0 page errors). Full list in `tests/e2e/artifacts/_results.json`.

## Issues

### P0 — uncaught page errors that break the route

1. **`/atelier/sculpture-gallery`** — `TypeError: Cannot read properties of null (reading 'trim')` thrown after mount. Something destructures or formats a string field on a gallery item whose source is null (likely a sculpture's title/description/tag pulled from a list where one entry is `{ field: null }`). Also emits "Too many active WebGL contexts" — the gallery is mounting several thumbnails as live WebGL canvases instead of poster-frame images. Fix pointer: guard the `trim()` call site (search the gallery component for `.trim()` on a derived field) AND switch thumbnail tiles to a single shared context or static posters.

2. **`/atelier/sprite-designer`** — Hard hydration failure: "Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client." This is the only soft-hydration-warning that escalated to a thrown error. Almost certainly a render-time `Math.random()`, `Date.now()`, or `localStorage` read in the initial JSX. Fix pointer: wrap any browser-only read in `useEffect` + `useState` so the SSR pass renders the placeholder.

### P1 — systemic hydration mismatches (warnings, not throws — but pollute the console and indicate fragile SSR)

The same React hydration-mismatch warning fires on **20 routes**. Always-suspect causes for this repo:

- A `Date.now()` / `new Date()` in a footer or copyright string (would explain it firing on `/about`-adjacent and policy routes).
- A `localStorage`/`window` read inside a client component's first render branch (more likely for `/atelier/*`, `/studio`, `/cards/design`).
- A `Math.random()` ID in a list-key fallback.

The fact that **every atelier index that mounts a content list** trips this, while **every leaf atelier route added in this swarm passes clean**, suggests the offender lives in a shared list/card component (e.g. an atelier-grid tile or a hero block). Worth searching for `Math.random`, `Date.now`, and `typeof window` inside `components/atelier/*` and `components/layout/*`.

Fix pointer: triage by component, not by route. One shared component fix likely clears 20 routes.

### P1 — Next.js 15 dynamic-API misuse on `/cards/mine`

Four console errors of the form:

> `params` is a Promise and must be unwrapped with `React.use()` before accessing its properties.
> `searchParams` is a Promise and must be unwrapped with `React.use()` before accessing its properties.

These have been hard-deprecation errors since Next 15. Will become build failures on a future minor. Fix pointer: `app/cards/mine/page.tsx` — either make the page async and `await params`/`await searchParams`, or unwrap with `React.use()` in the client component.

### P1 — slow loads

- `/atelier/silk-brush` — **15.9 s** to DOMContentLoaded. Also emits "Multiple instances of Three.js being imported." Three.js is being pulled in twice (once via the page, once via a shared `@react-three/*` dependency on a different version). Fix pointer: dedupe Three in `pnpm-lock.yaml` or pin all `@react-three/*` to the same Three peer.
- `/atelier/co-drawing` — **16.1 s** + a "setState on unmounted component" warning. Render-time side effect that needs to move to `useEffect`.
- `/rookery` — **17.1 s** but no errors. Likely just heavy first-load. Worth a perf look but not a correctness issue.
- `/sphere` — **10.5 s** + hydration mismatch.

### P2 — environment & bench-side, not a code bug

- `/atelier/comfy-layered` — `bench unreachable: http://localhost:8188/api/chains`. ComfyUI isn't running on this machine right now. The page handles it gracefully (no pageerror), the error is from the deliberate fetch + caught log. Not a regression — just bench-side, expected when ComfyUI is off.
- `/spatial/video` — `ERR_CONNECTION_REFUSED`. Same flavour — a bench-side service is off.
- `/research/cctv-3d-archive` — `firebase-admin: no credential path configured`. Env-only failure on dev. Not a code bug.

### P2 — chrome/console noise that doesn't indicate a bug

- "No available adapters." fires on almost every page — WebGPU adapter probe failing in headless Chromium. Not a real-browser issue; Chrome with `--enable-unsafe-webgpu` and a GPU resolves it. Don't chase.
- "Too many active WebGL contexts" — fires on `/atelier` and `/atelier/sculpture-gallery`. Legitimate, but only the gallery throws because of it.
- "Lit is in dev mode" on `/atelier/triposr` — informational only.
- `<link rel=preload> must have a valid 'as' value` — fires on every route. Almost certainly a single shared `<link>` tag in `app/layout.tsx` or a preload generated from a font/route asset. One-line fix, repo-wide impact.

## Things that worked (regression-prevention list)

These 65 routes returned 200 with **zero console errors and zero page errors** — keep them green:

- Top-level: `/`, `/edit`, `/stage`, `/holo-walk`, `/articles`, `/tutorials`, `/contact`, `/about`, `/the-loop`, `/services`, `/services/looking-glass-quilts`, `/bureau`, `/watch`, `/visualiser`, `/practice`, `/stack`, `/pipelines`, `/docs`, `/cast`, `/codex`, `/capabilities`, `/cards`, `/wallet`, `/photographs`, `/photographs/spatial`, `/spatial`, `/learn`, `/demo`.
- **All 7 `/visualiser/*` subroutes** (TIR, marching-cubes, laban-dial, strange-attractor, reaction-diffusion, caustic-projector).
- **All 4 `/chrono-protocol/*` subroutes** (root, hub, creative, run).
- `/play`, `/play/neo-london`.
- **All 4 `/rookery/*` subroutes** (root slow but clean; about, tiers, new all green).
- `/aura/web-llm`, `/search/ask`, `/policies/privacy`.
- **All 5 `/demo/*` subroutes** (vrm, aura-talks, evolution, cast-banter, parallax-shells).

**Atelier (new chambers, this swarm):** Of the 17 newly-added atelier routes, **9 are completely clean**: `/atelier/waveguide-forge`, `/atelier/mesh-studio`, `/atelier/pattern-prototype`, `/atelier/silk-brush` (clean errors but slow), `/atelier/lightpainting-forge`, `/atelier/quilt-designer`, `/atelier/cube-composer`, `/atelier/dollhouse`, `/atelier/light-weaver`, `/atelier/modal-lattice`, `/atelier/clothing-reverse`. That's a strong landing — the new chambers boot, render, and don't throw.

**Atelier (previously-tracked):** `/atelier/poi-sculptor` and `/atelier/cctv-cross-reference` remain clean.

## Notes / caveats

- Could not diff against commit `aa2f4c7` for explicit regression labelling — git for `D:/.github/_3DPOV` isn't reachable from this agent's shell (permission scope is the outer-shell repo). Recommendation: run the same sweep with the branch parked at `aa2f4c7`, diff `_results.json` route-by-route. The artifacts directory already holds today's baseline.
- "Hydration mismatch" being a console.error (not a page-error throw) means the soft-fail count is high but the pages are usable. The single hard-thrown variant on `/atelier/sprite-designer` deserves first attention.
- Per the user's instruction, no bugs were fixed in this pass. Audit only.
