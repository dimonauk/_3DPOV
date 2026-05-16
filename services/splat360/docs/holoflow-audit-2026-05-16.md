# Holoflow site audit — 2026-05-16

Audit of `D:\.github\_3DPOV\` (branch `holoflow-commerce`, auto-deploys
to Vercel prod). Read-only. Pre-push situational awareness.

## TL;DR

- **Production build is broken.** `pnpm run build` fails on two
  distinct compile errors. Do not push to `holoflow-commerce` until
  both are fixed. Details in P0 below.
- The capability registry is consistent: 32 ids declared in
  `_base.ts`, all 32 registered in `index.ts`, every `load()` target
  resolves. One real file is unregistered on purpose
  (`viz/splat-compose*`, intentional — referenced only in another
  capability's doc string).
- TypeScript is clean (`tsc --noEmit` exits 0). Tech debt is small
  and localised. The site's risk surface today is dependency drift
  and the deploy-blocker pair above, not the codebase.

## P0 — deploy blockers

### 1. Route collision: `app/holo-walk/[id]/qr/`

```text
app\holo-walk\[id]\qr\page.tsx
You cannot have two parallel pages that resolve to the same path.
Please check /holo-walk/[id]/qr/page and /holo-walk/[id]/qr/route.
```

Both `app/holo-walk/[id]/qr/page.tsx` (the printable signage page)
and `app/holo-walk/[id]/qr/route.ts` (the on-demand PNG endpoint)
sit at `/holo-walk/<id>/qr`. Next.js App Router treats this as a
naming conflict and refuses to build. Recorded at `dev.log`-free
output of `pnpm run build` (build log captured at `/tmp/build2.log`).

**Fix shape**: move the PNG route to a distinct path. The page
already gestures at one — `app/holo-walk/[id]/qr/page.tsx:8` imports
`sculptureQrSvg` and `sculptureQrPng`. Move the PNG endpoint to e.g.
`app/holo-walk/[id]/qr.png/route.ts` (Next.js accepts a `.` segment
on a leaf route) or `app/holo-walk/[id]/qr/png/route.ts` and update
`lib/holo-walk/qr.ts:sculptureQrPng` to match. Pure local change; no
schema work.

### 2. `onnxruntime-node` `.node` binaries enter the client bundle

```text
./node_modules/.pnpm/onnxruntime-node@1.21.0/.../onnxruntime_binding.node
Module parse failed: Unexpected character '�' (1:0)
...
Import trace: ... /@huggingface/transformers@3.8.1/dist/transformers.node.mjs
   ← kokoro-js@1.2.1 ← components/aura/voice/kokoro-worker.ts
   ← components/aura/voice/use-voice.ts ← components/aura/aura-launcher.tsx
```

Four binaries (`darwin/arm64`, `darwin/x64`, `linux/arm64`,
`linux/x64`) hit webpack. Root cause: kokoro-js@1.2.1 declares a
peer on `@huggingface/transformers` and pnpm hoists the older 3.8.1
beside the project-direct 4.2.0 (see `pnpm-lock.yaml`: both
`@huggingface+transformers@3.8.1` and `@huggingface+transformers@4.2.0`
materialise in `.pnpm/`). The webpack alias in
`next.config.ts:60-66` maps `@huggingface/transformers$` to
`@huggingface/transformers/dist/transformers.js` — that resolves
inside the v4 tree only. The kokoro-side resolution finds 3.8.1's
`dist/transformers.node.mjs`, which `require`s onnxruntime-node.

**Fix shape**: either (a) pin the transformers version kokoro-js
sees via `pnpm.overrides`, or (b) widen the webpack alias to target
both nested package paths by absolute id (e.g. drop the regex `$`
and point both to a web bundle), or (c) add `onnxruntime-node` to
the existing `config.resolve.alias` block at
`next.config.ts:39-46` so the `false` alias takes effect — it's
already there in the *upper* fallback block but the v3.8.1
re-entry into webpack chases a different specifier path. This is
exactly the failure pattern documented in
`[[holoflow-deploy-gotchas]]` (skill exists, see Skill-reference
table).

Both errors fire on `pnpm run build`. Build failure → Vercel build
failure. Do not push.

## P1 — should fix soon

### `middleware` filename is deprecated

`dev.log` records:

```text
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

No `middleware.ts` exists at the repo root — the warning is fired
by Next 15.6 from a stale `.next/` cache or a residual reference.
Worth a clean rebuild + a `find` audit before the next push to
confirm the warning has nothing to anchor on.

### `experimental.inlineCss` is disabled with a canary-bug rationale

`next.config.ts:3-8` says inlineCss is off because Next 15.6 canary
emits font URLs without `/_next/static/` prefix. As of today the
project is still pinned to `next@15.6.0-canary.60`. Re-test the
canary bump (or the route to Next 16) and turn the optimisation
back on if fixed upstream.

### Lockfile detection ambiguity

Build log emits:

```text
⚠ Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles and selected the directory of
D:\package-lock.json as the root directory.
```

There's a stray `D:\package-lock.json` competing with the project's
`pnpm-lock.yaml`. Either set `turbopack.root` in `next.config.ts` or
delete the orphan `D:\package-lock.json`. Currently harmless because
the project script forces `--webpack`, but the warning will haunt
the next Turbopack transition.

### kokoro/transformers version mismatch

Two `@huggingface/transformers` versions in the lock (3.8.1 +
4.2.0). Even with the build fixed, this is dead weight in `node_modules`
and makes the alias trap above easy to fall back into. Pin kokoro's
peer through `pnpm.overrides` to 4.2.0 if compatible, or drop the
project-direct 4.2.0 and live with 3.8.1.

### Unused dependency

`qr-code-styling: ^1.9.2` — no imports across `lib/`, `app/`,
`components/`, `scripts/`, `python-services/` (verified via
`grep -rln "qr-code-styling\|QrCodeStyling" --include="*.ts" ...`).
The QR work uses `qrcode` directly (`lib/qr.ts`). Drop it.

## P2 — tech debt visible

### TypeScript escape hatches

- `@ts-ignore` + `@ts-expect-error`: 2 total, both with comments
  explaining why:
  - `components/aura/voice/whisper-worker.ts:26` — third-party
    option not in @types
  - `lib/capabilities/ar/compile-target.server.ts:76` — Node
    `Module._resolveFilename` internals
- `any` / `as any` usages: 31 across 17 files. Hot spots:
  - `components/aura/voice/kokoro-worker.ts` (2)
  - `components/cart/actions.ts` (3)
  - The rest are 1 each, mostly in third-party adapter boundaries
    (`types/*.d.ts`, `next.config.ts`'s webpack callback type).

Not a problem at this size. Listing for awareness, not action.

### `chrono-protocol` constants are stubs

`lib/chrono-protocol/constants.ts:103-124` defines `RUN_PHASE_DURATION_MS`,
`COMBO_DECAY_PER_SECOND`, and `MODE_SWITCH_COOLDOWN_MS` as commented-out
`= TODO` lines. The route at `app/chrono-protocol/run/page.tsx`
flags itself as scaffold-only at line 22. Phase: foundation. Not a
blocker; just won't run end-to-end yet.

### `lib/play/state.ts` + `app/api/play/progress/route.ts` stubs

5 of the day's 39 TODO/FIXME lines (12.8%) live in `app/api/play/`
and `lib/play/state.ts` waiting on firebase-admin wiring. The
in-memory fallback is honest about itself — phase: foundation.

### Splat-compose orphan

`lib/capabilities/viz/splat-compose.ts` + `splat-compose.server.ts`
exist (158 + 78 lines), but `splat-compose` is *not* registered in
`lib/capabilities/index.ts`. It is mentioned only once outside its
own files — a doc string in `splat-generate.ts:139` ("composed
splat-compose scenes"). If the intent is "registered next wave",
add a `viz.splat-compose` id to `_base.ts:CapabilityId` and a
record. If "scaffold only," move the files behind an explicit
`_drafts/` prefix so they don't read as live capabilities. Mild,
but the registry's whole pitch is "one ledger of truth."

## Routes inventory

103 routes (one `page.tsx` each) under `app/`. Categorised:

| Section | Routes | PURPOSE.md | Notes |
| --- | --- | --- | --- |
| Root + about | `/`, `/about`, `/contact`, `/the-loop`, `/sphere`, `/stack`, `/docs`, `/apps`, `/bezel`, `/learn`, `/practice`, `/productions`, `/services`, `/services/looking-glass-quilts`, `/spatial`, `/spatial/video`, `/wallet`, `/watch` | none | core marketing surface |
| Studio (NEW) | `/studio`, `/studio/[[...tool]]` | `app/studio/PURPOSE.md` (+ `PRINT.md`) | the new browser 360 editor |
| HoloWalk | `/holo-walk`, `/holo-walk/[id]`, `/holo-walk/[id]/ar`, `/holo-walk/[id]/qr` | client-component PURPOSE.md files present at `holo-walk-map-client`, `[id]/ar/ar-window-client`, `[id]/sculpture-preview-client` | **`qr/page.tsx` + `qr/route.ts` collision — P0** |
| Aura + atelier | `/atelier/*` (9 routes), `/aura/web-llm`, `/demo/*` (5), `/cast`, `/capabilities`, `/codex/[slug]`, `/codex` | none | active development area |
| Articles + journal + tutorials | `/articles`, `/articles/[slug]`, `/journal`, `/journal/[slug]`, `/tutorials`, `/tutorials/[slug]` | none | content surface |
| Commerce | `/product/[handle]`, `/c/[slug]`, `/c/[slug]/card`, `/c/preview`, `/search`, `/search/ask`, `/search/[collection]`, `/bureau`, `/cards/*` (6) | none | shopify storefront + cards |
| Chrono-protocol + play | `/chrono-protocol`, `/chrono-protocol/hub`, `/chrono-protocol/run`, `/chrono-protocol/creative`, `/chrono-protocol/zone/[slug]`, `/play`, `/play/[level]`, `/play/neo-london`, `/play/neo-london/zone/[slug]` | none | game surfaces, foundation-phase |
| Rookery + auth | `/rookery`, `/rookery/[id]`, `/rookery/about`, `/rookery/new`, `/rookery/tiers`, `/signin`, `/signin/callback` | none | community + auth |
| Visualiser series | `/visualiser` (+ 5 sub-routes) | none | algorithmic demos |
| Admin + research | `/admin/*` (6), `/research` (+ 2 sub) | none | private + research |
| Photographs + aerial | `/photographs`, `/photographs/spatial`, `/aerial`, `/pipelines` | none | content + pipelines |
| Policies | `/policies/*` (4) | none | legal |
| Other | `/[page]`, `/policies/[handle]` | none | catch-alls |

**Navbar exposes**: `/`, `/stack` only (`components/layout/navbar.tsx:64,97`).
The footer (`components/layout/footer.tsx`) lists 27 destinations
but `/studio`, `/holo-walk`, `/capabilities`, `/aura/web-llm`,
`/cards`, `/wallet`, `/cast`, `/codex`, and most demo routes are
not linked from either. By design or by lag? Worth a deliberate
decision before the next push — `/studio` deserves nav exposure if
it's launch-ready.

## Capability registry consistency

`CapabilityId` union in `lib/capabilities/_base.ts:70-109` declares
32 ids. `lib/capabilities/index.ts:auraAliveStubs` registers 32
records. 1:1 match. Every `load: () => import("./<x>")` points at
an existing file under `lib/capabilities/`.

| Capability ID | File | Status |
| --- | --- | --- |
| `vrm.load` `vrm.bones.pose` `vrm.expressions.blend` `vrm.lookAt` | `vrm/{load,pose,expression,look-at}.ts` | registered |
| `audio.stt` `audio.tts` `audio.visemes` `audio.lipsync-analysis` | `audio/{stt,tts,visemes,lipsync-analysis}.ts` | registered |
| `motion.idle` `motion.gesture` `motion.laban` | `motion/{idle,gesture,laban}.ts` | registered |
| `agent.banter` `agent.dialogue` `agent.memory` | `agent/{banter,dialogue,memory}.ts` | registered |
| `agent.dialogue-webgpu` `agent.dialogue-ollama` | `agent/{dialogue-webgpu,dialogue-ollama}.ts` | registered (NEW: dialogue-ollama; stub-quality, server file present) |
| `input.headpose` | `input/headpose.ts` | registered |
| `viz.attractor` `viz.depth-estimation` `viz.light-sculpture` `viz.particles` `viz.spatial-export` `viz.splat-render` `viz.stereo-pair` `viz.usdz-export` | `viz/*.ts` | registered |
| `viz.splat-generate` `viz.splat-generate-360` `viz.splat-ar-deploy` `viz.thumbnail-splat` `viz.generate-comfyui` | `viz/*.ts` (+ `.server.ts` siblings) | **stub** (all 5) — type surface + router, no concrete provider wired yet |
| `geo.position` `ar.window` `ar.compile-target` `media.capture` | `geo/`, `ar/`, `media/` | `ar.compile-target` is **stub** (mind-ar ESM-shim caveat); rest registered |
| `commerce.sharp-job` `commerce.sharp-video-job` `commerce.print-order` | `commerce/*.ts` | registered |

**Unregistered files** (real `.ts` modules in `lib/capabilities/`
that are not in the index):

| File | Why it's unregistered | Action |
| --- | --- | --- |
| `viz/splat-compose.ts` + `.server.ts` | new today; mentioned in `splat-generate.ts:139` doc string only | either register a `viz.splat-compose` id or move to a `_drafts/` shelf |
| `audio/tts-providers/{elevenlabs,f5,kokoro,web-speech}.ts` | provider plug-ins for `audio.tts`, intentionally internal | fine — these are sub-modules, not capabilities |
| `commerce/sharp-video-job-{parser,types}.ts` | helpers for `commerce.sharp-video-job` | fine — sub-modules |
| `media/library*.ts` + `media/library-{types,blob,firestore}.ts` | internal storage layer | fine — `media.capture` is the public capability; the library is its dependency |

So one real inconsistency (`splat-compose`), everything else is
expected sub-module shape.

## Dependency state

`pnpm exec pnpm outdated` (full table captured during audit). Highlights:

| Package | Current | Latest | Risk |
| --- | --- | --- | --- |
| `next` | 15.6.0-canary.60 | 16.2.6 | Canary in production. The build script already pins `--webpack` to dodge the Turbopack default. Plan the 16-major when ready. |
| `react` / `react-dom` | 19.0.0 | 19.2.6 | Minor behind. `package.json` declares `19.0.0` exact pin; the day's transformers/kokoro fight wants 19.x at minimum. Safe bump. |
| `three` | 0.171.0 | 0.184.0 | 13 minor versions behind. `@types/three` matches. Three releases minor-as-major. Bump cautiously; gaussian-splats-3d + spark + drei version-pin against three. |
| `@types/node` | 22.13.10 | 25.8.0 | Node-version mismatch is known (this is the Node-25-on-Windows project that needed `@napi-rs/canvas`). Track but not urgent. |
| `typescript` | 5.8.2 | 6.0.3 | TS 6 is breaking. Hold. |
| `@sparkjsdev/spark` | 0.1.10 | 2.0.0 | Major jump. Reads the splat .ply pipeline; treat as a v2-migration item. |
| `@huggingface/transformers` | 4.2.0 (project) + 3.8.1 (kokoro-js peer) | n/a | dual version is the **root cause of build failure #2**. Fix via pnpm.overrides. |
| 17 other minors behind | (firebase, mediabunny, sonner, prettier, etc.) | latest | low-risk routine bump |

Unmet peer warnings: `pnpm install` finished clean today
(`Lockfile is up to date, resolution step is skipped / Already up to
date`). Nothing screaming via warnings.

### `package.json` shape — sanity check

| Line | Verified |
| --- | --- |
| `"canvas": "^3.2.3"` (dep) | `package.json:42` ✓ |
| `"@napi-rs/canvas": "^1.0.0"` (dep) | `package.json:32` ✓ |
| `pnpm.overrides.canvas: "^3"` | `package.json:85-87` ✓ |
| `pnpm.onlyBuiltDependencies: ["@napi-rs/canvas", "core-js", "onnxruntime-node", "sharp"]` | `package.json:88-93` ✓ |
| `"build": "next build --webpack"` | `package.json:6` ✓ (relevant — without `--webpack`, the build fires the Turbopack default and hits a *different* "no turbopack config" error, see `/tmp/build.log` from the audit) |

Note: `canvas` package is in `dependencies` but no first-party
source file imports it directly. The dep is there for the
`pnpm.overrides` mechanism to force mind-ar's transitive `canvas`
resolution to v3 (the working npm version), even though our actual
runtime path uses `@napi-rs/canvas` via the
`Module._resolveFilename` shim documented at
`lib/capabilities/ar/compile-target.server.ts:1-50`. That is
intentional — leave both.

## Recent-additions integrity

The day's net-new work:

| Item | File(s) | Status | Notes |
| --- | --- | --- | --- |
| `viz.splat-generate-360` | `lib/capabilities/viz/splat-generate-360.ts` + PURPOSE | **stub registered** | type surface only; bench-side `splat360` extension TODO at `splat-generate.server.ts:390` |
| `viz.splat-ar-deploy` | `lib/capabilities/viz/splat-ar-deploy.ts` + `.server.ts` + PURPOSE | **stub registered** | QR + USDZ fallback flow described, deploy-side blob storage wiring stubbed |
| `viz.thumbnail-splat` | `lib/capabilities/viz/thumbnail-splat.ts` + `.server.ts` + PURPOSE | **stub registered** | card-fast provider live via @napi-rs/canvas; splat-real path defers to HoloFlow Desktop helper |
| `viz.generate-comfyui` | `lib/capabilities/viz/generate-comfyui.ts` + `.server.ts` + PURPOSE | **stub registered** | targets bench ComfyUI via `[[holoflow-bench-bridge]]` pattern; provider stub |
| `agent.dialogue-ollama` | `lib/capabilities/agent/dialogue-ollama.ts` + `.server.ts` + PURPOSE | **stub registered** | targets bench Ollama via the same bridge pattern |
| `ar.compile-target` | `lib/capabilities/ar/compile-target.ts` + `.server.ts` + PURPOSE | **stub registered** | ESM-shim caveat documented; fall-forward at `scripts/ar-compile-mind.mjs` |
| `/studio` route | `app/studio/page.tsx`, `app/studio/[[...tool]]/page.tsx`, `studio-client.tsx`, `PURPOSE.md`, `PRINT.md` | client + server pages present, four components wired (`DropZone`, `EquirectViewer`, `KeyframeStrip`, `ExportPanel`) | not linked from navbar/footer yet |
| `/holo-walk/[id]/qr` route | `app/holo-walk/[id]/qr/page.tsx` + `route.ts` | **P0: route collision** | page + route at same path; see P0 §1 |
| `components/studio/*` | 4 files | clean | foundation-phase ExportPanel has 3 TODOs for blob-URL handling (`ExportPanel.tsx:631,646`) |
| `components/holo-walk/splat-ar-layer.tsx` | 1 file | clean | wires the splat-AR-deploy surface for the AR page |
| `lib/qr.ts` + `lib/holo-walk/qr.ts` | 2 files | clean | size + scan-distance helpers + per-sculpture URL/SVG/PNG generators |
| `lib/studio/*` | 6 files (`desktop, print-export, source-detection, stitch, topaz-handoff, types`) | clean | the operator-side studio glue |
| `package.json` canvas swap | `pnpm.overrides.canvas` + `@napi-rs/canvas` dep | clean | see § `package.json` shape |

Every new capability registers, every new file imports cleanly
(`tsc --noEmit` passes), every PURPOSE.md the brief asked about
exists. The only real integrity issue is the route collision in
holo-walk/qr.

## TODO/FIXME catalogue

39 hits across 22 files. Grouped:

### Tagged as foundation-phase / explicit waves (not blockers)

- `lib/chrono-protocol/constants.ts:103,111,122` — 3× `TODO: derive ...`
  for run-phase + combo-decay + mode-switch constants
- `components/chrono-protocol/tunnel.tsx:14,21` — Wave 2 + Wave 5
- `components/chrono-protocol/poi-controls.tsx:13` — Wave 3
- `app/chrono-protocol/run/page.tsx:22` — scaffold marker
- `app/chrono-protocol/creative/page.tsx:23` — Wave 7
- `app/api/chrono-protocol/{score,leaderboard}/route.ts:89,95` — Wave 8 persistence
- `components/play/scenes/{braid,bezel,curriculum,perch,sovereignty}-scene.tsx:14-15` — 5× rhythm-engine / WebXR / per-rung / publish-path / SW TODOs
- `components/play/progress-block.tsx:33` — firebase-admin wiring
- `app/api/play/progress/route.ts:25,57,114` — firebase-admin wiring
- `lib/play/state.ts:172,186` — Firestore read/write stubs
- `app/atelier/algorithms/[slug]/page.tsx:168` — source-port pending
- `lib/capabilities/viz/splat-compose.server.ts:41` — bench fusion
- `lib/capabilities/viz/splat-generate.server.ts:390,409` — bench-side wiring (2)
- `lib/evolution/fitness.ts:18,24,171,175` — 4 placeholder defaults

### Genuine v1 deferrals (need attention before that surface ships)

- `components/studio/ExportPanel.tsx:631,646` — 2× blob-URL TODO inside the
  print-export client path. Until resolved, the export panel's
  PNG-grab works but the equirect-image / video paths leave hidden
  edge cases on iOS.
- `app/rookery/page.tsx:17` — Stripe success → `/api/rookery/onboarding`
  is the gate between the subscription tiers landing page and the
  actual member onboarding. Whole Rookery is gated on this.
- `components/analytics/klaviyo.tsx:12` — `XXXXXX` is a Klaviyo
  form-id placeholder, not real tech debt.

### Suggested triage

Everything in the first group is honest documentation of phase, not
debt. Everything in the second group is on the critical path for one
named feature. None of them block today's deploy.

## Skill-reference link check

Code comments reference 3 distinct skills with `[[skill]]` syntax.

| Skill | Reference sites | Skill file present? |
| --- | --- | --- |
| `holoflow-bench-bridge` | `lib/capabilities/agent/dialogue-ollama.ts:33`, `dialogue-ollama.server.ts:15`, `viz/generate-comfyui.server.ts:15`, `viz/generate-comfyui.PURPOSE.md:29` | ✓ `C:\Users\dimon\.claude\skills\holoflow-bench-bridge\SKILL.md` |
| `dji-osv-format` | `app/studio/PURPOSE.md:25` | ✓ `C:\Users\dimon\.claude\skills\dji-osv-format\SKILL.md` |
| `holoflow-deploy-gotchas` | `app/studio/PURPOSE.md:70` | ✓ `C:\Users\dimon\.claude\skills\holoflow-deploy-gotchas\SKILL.md` |

Bonus spot-checks (not in code but worth confirming):
`holoflow-canvas-server`, `holoflow-splat-vertical` — both present.

All 5 spot-checked skills exist. Skill-reference hygiene is clean.

## Healthy / no concerns

- **TypeScript surface**: `pnpm exec tsc --noEmit` exits 0, no
  output. Captured at `/tmp/tsc.log` (empty).
- **Capability registry**: 32:32 declared-vs-registered; no
  broken `load()` targets; every registered capability's underlying
  file present.
- **PURPOSE.md coverage** in `lib/capabilities/`: 40 PURPOSE files
  for 54 `.ts` files. Every public capability has one; the missing
  14 are sub-modules + parser + types files, which is intended.
- **`@ts-ignore` / `@ts-expect-error`**: 2 total, both with
  comments. Healthy.
- **Hosting + config**: `vercel.json` has the explicit cache headers
  for `/cards/:slug/{target.mind, model.glb, model.usdz}` plus a
  pattern for `(card-front|qr).(png|svg)` — the AR-card commerce
  surface is wired right. `next.config.ts` carries the documented
  Node-side polyfill stubs + the mind-ar / kokoro alias block
  (with the asterisk that the alias misses the v3.8.1 path, see
  P0 §2).
- **Scripts inventory**: 10 scripts in `package.json`, all
  invocable, including the AR-cards toolchain (`cards:build`,
  `cards:mind`, `cards:qr`, `cards:upload`) and the
  `postinstall: node scripts/patch-mind-ar.mjs` (which reported
  "already patched, nothing to do" — the patch is idempotent).
- **`pnpm install`** runs clean. Lockfile in sync. No unmet peer
  warnings surface.
- **No `canvas` package directly imported** anywhere in
  first-party code (`grep -rn "from [\"']canvas[\"']" lib app
  components scripts` returns only doc-comment hits inside
  `lib/capabilities/ar/compile-target.server.ts:12,19,21,154`).
  The package's role is purely to satisfy mind-ar's transitive
  require under `pnpm.overrides`.
- **Recent new capabilities all import cleanly** (`tsc` pass
  covers them).

---

Summary: one route collision + one webpack alias mis-targeting are
the only things between this branch and a green Vercel deploy.
Everything else is foundation-phase honesty and routine drift.
