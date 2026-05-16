# app/atelier/lightpainting-forge/

A long-exposure light trail becomes a printable 3D sculpture.

## What this chamber does

Operator drops a photograph of a poi spiral (or any light trail). The
chamber:

1. Renders the photo in a click-driven segmentation overlay.
2. Per click: pulls a mask out of SAM2 (or a luminance threshold
   fallback) and a per-pixel depth map out of Depth-Anything-V2 (or a
   luminance proxy).
3. Voxelises mask + depth into a `res^3` scalar field where each
   masked pixel sits at its estimated Z.
4. Runs marching cubes to build a triangle mesh.
5. Renders the mesh live in an R3F preview with orbit + translucent
   physical material.
6. Exports a binary GLB scaled to the operator's mm setting; pushes
   the artefact into the atelier output drawer.

## Crossover

The trails forged here are the sculptures HoloWalk re-anchors at the
spots the photographs were taken. The chamber is a bench tool for
building HoloWalk's content library, but visitors can run it too —
nothing on the page is gated.

## Source + ported pieces

Ported from the Vite app at `D:/The_Hangar/apps/lightpainting-forge/`.
Notable changes on port:

- `marching.ts` import `./voxels` (broken in source — no such file)
  rewritten to import the shared `Field` type from `./field.ts`.
- CSS replaced with Tailwind classes matching atelier chrome.
- `console.*` replaced with the structured `lib/log` logger under the
  namespace `atelier:lightpainting-forge`.
- GLB download wires into `pushAtelierOutput` so the result shows in
  the floating recent-outputs drawer.
- Geometry disposed on unmount/swap (memory-leak hygiene per
  dollyos-memory-leaks).

## What the operator needs to drop in

For the rich path:

1. The Python backend at `tools/lightpainting-forge-backend/server.py`
   (port 5283) — runs SAM2 + Depth-Anything-V2.
2. A Next.js rewrite (or proxy) mapping:
   - `/api/sam2/segment` -> `http://<bench>:5283/segment`
   - `/api/depth` -> `http://<bench>:5283/depth`
   - Use the Tailscale Funnel + bearer-token pattern from
     `holoflow-bench-bridge` if exposing publicly.

Without those: the chamber works with luminance fallbacks. Status
pills tell the operator which path is live.

## Files

- `page.tsx` — server-component shell + `metadata`.
- `lightpainting-forge-client.tsx` — `"use client"` root.
- `segmentation-canvas.tsx` — `"use client"` SAM2 click overlay.
- `mc-tables.ts` — Bourke/Lewiner marching-cubes lookup tables.
- `marching.ts` — pure-TS marching-cubes implementation.
- `field.ts` — shared `Field` type.
- `mask-and-depth-to-field.ts` — voxeliser.
- `export-glb.ts` — GLTFExporter wrapper + watertight check.
- `sam2-client.ts` — segmentation fetch + luminance fallback.
- `depth-client.ts` — depth fetch + luminance fallback.
