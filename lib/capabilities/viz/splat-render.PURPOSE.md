# `viz.splat-render` — Embed a Gaussian Splat in a viewport

A viewer-agnostic capability for displaying `.ply` gaussian splats on
the site. Companion to `viz.splat-generate`; once a record exists,
this is how it gets seen.

## The three renderers

| Renderer | Tier | Where it fits |
|---|---|---|
| **spark-js** (sparkjsdev/spark) | Web | Default for product pages — runs inside R3F scenes, integrates with the site's three.js stack |
| **supersplat-iframe** | Web | Markdown / journal surfaces that can't host R3F; PlayCanvas SuperSplat in an iframe |
| **postshot-binary** | Bench-only | Studio review — opens the .ply in the installed Postshot.exe via a protocol handler |

Public surfaces only pick from `web` renderers. The bench-only tier
exists for the studio's internal review workflow.

## PLY flavour gating

Every web renderer expects the standard INRIA-3DGS PLY layout:

```
x, y, z, nx, ny, nz,
f_dc_0..2, f_rest_0..44,
opacity, scale_0..2, rot_0..3
```

with a single `vertex` element and nothing trailing. SHARP's raw PLYs
carry extra metadata elements (`extrinsic`, `intrinsic`, `image_size`,
`frame`, `disparity`, `color_space`, `version`) that web renderers
reject. SHARP outputs must pass through `convert_sharp_ply.py` in
`D:/The_Hangar/engines/sharp-onnx/` before this capability will accept
them — `pickSplatRenderer` throws `flavour-mismatch` when the record's
`plyFlavour !== "standard-3dgs"`.

## Why viewer-agnostic

Splat viewers have different strengths:

- **Spark** is the lightest, integrates with R3F, and supports
  per-gaussian transforms (useful for the "splat trail" idea where
  individual gaussians move along a curve).
- **SuperSplat** has the best editor UI (annotations, cropping, scale
  baking) — better for research surfaces where the user wants to
  inspect.
- **Postshot** has the best lighting model and re-training, but only
  runs as a native binary.

By keeping the renderer choice behind a capability, the site can swap
viewers per surface and per record without surface code knowing about
splat internals.

## Foundation-phase status

This file (`splat-render.ts`) defines the props surface and the
flavour-compatibility table. Concrete React components are not yet
wired. The first wire will be `<SplatViewerSpark>` to back the default
"product surface" embed.
