# `compile-target.ts` — purpose twin (capability `ar.compile-target`)

## Role

The seam that turns a reference image (a HoloWalk plaque, a printed AR
card front, a sculpture's QR placard) into a `.mind` feature-point
bundle that mind-ar's runtime can scan against. The runtime side
already lives in `components/ar/MindARScene.tsx` — that component
consumes a `card.ar.targetMind` URL pointing at a compiled `.mind`
file. This capability is how those `.mind` files come into being.

Without it, every new AR target requires the operator to remember the
existing `pnpm cards:mind <slug>` script, navigate to the right
folder, and shuttle files by hand. With it, the site can compile a
new target the moment an image lands in the media library.

## Why we need it

- **HoloWalk plaques** — the outdoor sculpture trail wants a unique
  scannable plaque per stop. Each plaque's photo becomes a `.mind`
  via this capability and the runtime then anchors the sculpture's
  GLB / splat / attractor to that scan.
- **Per-sculpture AR cards** — the printed-card AR programme already
  pipes through `MindARScene`. New card variants (limited drops,
  guest collaborations) need their own `.mind` files on demand.
- **Editioned-piece authenticity** — a future surface verifies the
  printed certificate's image against a per-edition `.mind` to gate
  the unlock. Same capability, different subject.

The mind-ar `OfflineCompiler` is the only piece of the mind-ar bundle
that handles the compile-time side; the runtime tracker is independent.
Isolating compile-time into its own capability also lets the site lift
the compute to HoloFlow Desktop (heavy) or push it into a Vercel
serverless function (light) without disturbing the runtime.

## Public surface

- `compileArTarget(input)` — browser stub. Throws `compile-failed`
  with a clear message: "invoke `compileArTargetServer` from a
  server-only context." The runtime stub exists so the registry can
  surface the capability on `/capabilities` without conditionally
  importing `server-only` modules.
- `compileArTargetServer(input, ctx)` (in `compile-target.server.ts`)
  — the real entry point. Returns `CompileArTargetResult` with
  `mindFileUrl` pointing at the persisted `.mind` blob.
- Types: `CompileArTargetInput`, `CompileArTargetResult`,
  `CompileArTargetError`, `CompileArTargetQuality`.

## The canvas shim story

mind-ar's `OfflineCompiler` opens with `import { createCanvas } from
'canvas'`. On Node 25 / Windows, `canvas@2.x` and `@3.x` ship native
prebuilds that don't load (DLL hell, verified 2026-05-15). The studio
has `@napi-rs/canvas` installed — same `createCanvas` / `loadImage`
API surface, working Windows prebuild.

The server file installs a `Module._resolveFilename` patch BEFORE the
dynamic-import of mind-ar lands. The patch rewrites any
`require('canvas')` call to `require('@napi-rs/canvas')`. CommonJS
resolution flows through this hook; ESM resolution does not. mind-ar
is published as ESM (`"type": "module"`) — its in-file
`import { createCanvas } from 'canvas'` resolves through Node's ESM
loader, which the patch does not intercept.

This means on Node 25 ESM the dynamic-import will likely throw when
the underlying `canvas@3.x` native bindings fail to load. The server
file catches that and throws `compile-failed` with a pointer at the
fall-forward:

## The fall-forward: `scripts/ar-compile-mind.mjs`

The repo already has a proven script that compiles `.mind` files
without touching the `canvas` package at all. It uses `sharp` to
decode the bytes and a `FakeCanvas` subclass to feed mind-ar's
`CompilerBase` directly. Runs today, in production, on every card
build. The next pass of this capability will port that same pattern
in-process (Option B in the v0 brief), at which point the shim
attempt becomes redundant and gets removed.

## The OfflineCompiler reference

- `D:/.github/_3DPOV/node_modules/mind-ar/src/image-target/offline-compiler.js`
  — the canvas-importing class; ~30 LOC, `extends CompilerBase`.
- `D:/.github/_3DPOV/node_modules/mind-ar/src/image-target/compiler-base.js`
  — `compileImageTargets` + `exportData`; the real algorithm.
- `D:/.github/_3DPOV/scripts/ar-compile-mind.mjs` — the working
  in-repo fall-forward.

## Output format

Single `.mind` blob, MIME `application/octet-stream`. No thumbnail
PNG — the source image already exists at the input URL; viewers that
want a thumbnail render from that, not a duplicate. The media record
carries `kind: "other"`, `subject: "deploy"`, tags
`["ar-target", "mind-ar"]`, and the operator-supplied `label` as the
record title. A future expansion of `MediaKind` to enumerate
`"mind-ar-target"` would be a strict subset migration.

## Bordering files

- `components/ar/MindARScene.tsx` — the runtime consumer. Reads
  `card.ar.targetMind` (the `.mind` URL) and the GLB; mounts the
  whole MindAR three.js scene.
- `lib/ar/types.ts` — the `Card` type whose `ar.targetMind` field
  this capability fills.
- `scripts/ar-compile-mind.mjs` — the working sibling script. Same
  algorithm via sharp + FakeCanvas; what the in-process impl will
  port from once the shim approach proves out (or doesn't).
- `lib/capabilities/media/library.ts` — the `mediaUpload` call site
  for the `.mind` blob.
- `lib/capabilities/ar/window.ts` — the other half of the AR
  surface. `ar.window` is runtime / magic-window; `ar.compile-target`
  is compile-time / asset-pipeline.

## Foundation-phase status

This file (`compile-target.ts`) defines the type surface and a
browser-side stub. The server impl (`compile-target.server.ts`)
attempts the real compile via the canvas-package shim; ESM resolution
inside mind-ar may defeat the shim, in which case it throws
`compile-failed` with a clear pointer at the working
`scripts/ar-compile-mind.mjs` fall-forward. v1 will port the
sharp + FakeCanvas pattern in-process and retire the shim.
