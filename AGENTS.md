# Agents working on this repo — read this first

This file is for **Claude / other coding agents** working on the Holo-Flow
Studio repo. Several sessions are operating concurrently. Read this before
making structural changes so we don't keep undoing each other's work.

## What lives where

This repo (`_3DPOV/`, deployed to Vercel as `holo-flow-studio` → `holoflow.co.uk`)
is the **Next.js application only**. Anything else lives in sibling repos.

| What | Where | Why |
|---|---|---|
| Next.js app (this repo) | `D:\The_Hangar\.merge-staging\_3DPOV\` | Vercel deploy target. Production = `holoflow-commerce` branch. |
| Python ML services | `D:\The_Hangar\holoflow-services\` | Vendored open-source projects (InstantMesh, TripoSR, Unique3D, HyWu, Splat360, SHARP-ONNX, Softxels, Lithophane, mesh-to-sdf, image-to-pixel, holoflow-services, webgpu-marching-cubes). Run locally on the cluster, never deployed via Vercel. |
| Firebase Functions Python | `functions/` (still in this repo) | Tied to `firebase.json`. Deploys via `firebase deploy --only functions`. Tiny — kept in-repo for convenience. |

## DO NOT do any of these

1. **Do not re-add `services/` to this repo.** It was moved on 2026-05-18
   to fix repeated Vercel build OOM failures (12.2 MB, 304 files of vendored
   Python that Next.js's file tracer was scanning on every build). If you
   need to reference the Python services from the Next.js code, **call them
   over HTTP** (they run as local services with FastAPI / Flask), don't
   import them.

2. **Do not delete `AGENTS.md`, `.vercelignore`, `docs/CHANGELOG.md`, or
   `docs/AGENT-COORDINATION.md`** — these are the only mechanisms we have
   to coordinate across sessions.

3. **Do not vendor large Python / ML projects into the Next.js repo.** If
   you find yourself needing one, put it in
   `D:\The_Hangar\holoflow-services\<name>\` and call it over HTTP.

4. **Do not flip `Content-Security-Policy-Report-Only` → enforce mode**
   without auditing violation logs first. The directive list in
   `lib/security/csp.ts` is intentionally permissive for the audit phase.

5. **Do not remove `lib/rate-limit/`.** It auto-detects Upstash and falls
   back to in-memory. The interface is stable; replace the backend if
   needed but keep the API.

## Build is fragile right now

`pnpm run build` has been OOMing on Vercel's default 4 GB build machines.
Recent attempts to fix:

- `next.config.ts` `outputFileTracingExcludes` for `onnxruntime-node` +
  `transformers` (commit `b7fad74`)
- Skipping build-time TS + ESLint checks (commit `cb44e54`) ← reduces
  safety; revisit once OOM is fully fixed
- Moving `services/` out of the repo (this commit) ← the main fix

If a build still OOMs after this commit, look at:

- `lib/holo-walk/data.ts` (1,847 lines) — heavy data file
- `services/hy-wu/` was the biggest single-file Python (modeling_hunyuan_image_3.py is 3,422 lines) — but it's gone now
- Any new `app/atelier/*` chamber that pulls in `three` + WebGPU + heavy WASM
- Consider Vercel Enhanced Builds (8 GB RAM, paid) as a fallback

## How to find files that were moved

If you find a reference like `services/foo/bar.py` in docs, scripts, or
comments and the file isn't here:

```powershell
ls D:\The_Hangar\holoflow-services\foo\bar.py
```

That's where it lives now.

## Coordination protocol

Before making any structural change (deleting routes, moving directories,
renaming top-level files, adding a new dependency that pulls in >50 MB),
**append a line to `docs/AGENT-COORDINATION.md`** with:

- Date/time
- Your branch
- What you're about to do
- Why

Other agents can then read that and avoid stepping on it.

Last updated: 2026-05-18 by the firewall-and-cleanup session.
