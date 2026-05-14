# `viz.splat-render` — Embed a Gaussian Splat in a viewport

A viewer-agnostic capability for displaying `.ply` gaussian splats on
the site. Companion to `viz.splat-generate`; once a record exists,
this is how it gets seen.

## The renderers (single-engine web stack)

| Renderer | Tier | Engine | Where it fits |
| --- | --- | --- | --- |
| **spark-js** (sparkjsdev/spark) | Web | three.js | Default for product pages — runs inside R3F scenes, integrates with the site's three.js stack |
| **gsplat-js** (`@mkkellogg/gaussian-splats-3d`) | Web | three.js | Alternative three.js implementation; lets us A/B without changing surface code |
| **postshot-binary** | Bench-only | Native (Vulkan) | Studio review — opens the `.ply` in the installed Postshot.exe via a protocol handler |

The web side is intentionally single-engine. Both Spark and gsplat.js
are three.js gaussian-splat libraries; keeping the renderer choice
within three.js means one WebGL/WebGPU context, one mental model, one
set of dependencies. If the field moves and neither holds up under
load, branching out to PlayCanvas SuperSplat in an iframe (or splat.js,
or a future option) happens here later — the renderer union absorbs
the change, not the surface code.

## PLY flavour gating

Both web renderers expect the standard INRIA-3DGS PLY layout:

```text
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

Three reasons to keep the renderer choice behind a capability:

1. **A/B between three.js libs.** Spark and gsplat.js have different
   strengths. Keeping both behind a single surface means swapping per
   page (or per record) without touching the React component above.
2. **Bench-only routes.** Postshot's native viewer is the right tool
   for studio review; the protocol-handler path keeps it accessible
   without polluting the public site.
3. **Future engines.** The day a non-three.js renderer becomes
   compelling enough to justify a second engine on the page (or in an
   iframe), the union grows by one and the type system catches every
   call-site that needs to think about it.

## Foundation-phase status

This file (`splat-render.ts`) defines the props surface and the
flavour-compatibility table. Concrete React components are not yet
wired. The first wire will be `<SplatViewerSpark>` to back the default
"product surface" embed.
