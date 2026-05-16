# `splat360` — 360-camera-first Gaussian Splat service

A Holoflow Studio engine that takes capture from spherical cameras (DJI Avata 360,
DJI Osmo 360, Insta360 X-series, GoPro Max, Ricoh Theta) and produces a
3D Gaussian Splat. The wedge is honest handling of the dual-fisheye
sensor pair rather than pretending it's a pinhole rig after stitching.

## Why this exists

DJI Terra Flagship ($2,800–4,400) handles splats but only for
Matrice/Mavic pinhole rigs. Mipmap3D ($30/mo) has no spherical support
at all. The consumer 360 drones DJI ships in 2026 (Avata 360, Osmo 360)
have no first-party splat pipeline that respects the sensor geometry.
Existing OSS (nerfstudio, gsplat, Brush) can do equirect SfM but treat
the stitched output as ground truth — so stitch-seam artefacts leak
into the splat.

This engine targets that gap.

## The three input paths

The pipeline branches on what the camera gives us:

| Path | Input shape | Camera model | Notes |
|---|---|---|---|
| **A: fisheye-pair** | Pre-stitch DNG pair (Avata 360 RAW, Insta360 .insp dual) | `OPENCV_FISHEYE` per lens, rig-coupled | Highest quality. No stitch contamination. |
| **B: equirect** | Stitched MP4 or 8K JPEG | `SPHERICAL` in COLMAP | Convenient. Stitch seam visible in splat. |
| **C: cubemap-reproject** | Equirect → 6 pinhole faces | `PINHOLE` × 6 per frame | Universal fallback. 6× image count. |

Path A is preferred whenever raw is available. Path B is the default
for video. Path C is the compatibility hammer for tools that refuse
spherical input.

## Licence track

All providers used here are commerce-safe:

- **COLMAP** — BSD-3
- **GLOMAP** — BSD-3
- **gsplat** — Apache-2.0
- **Brush** — MIT
- **ExifTool** — Perl/GPL (called as subprocess, no linking)
- **FFmpeg** — LGPL/GPL (subprocess)

No `apple-amlr` / research-only contamination. Outputs land on the
commerce track in [[holoflow_splat_vertical]].

## Connection to Holoflow

Surface binding lives at
`D:/.github/_3DPOV/lib/capabilities/viz/splat-generate-360.ts`
(sibling to the existing `splat-generate.ts`). The capability POSTs a
job to this service; the service writes the resulting `.ply` to the
configured blob store and returns a `SplatRecord` with `licence:
"commercial-ok"`.

## Connection to HoloWalk

The natural downstream consumer. A sculpture captured with Avata 360
in situ becomes a splat anchored at the GPS where it was shot — the
exact HoloWalk pattern.

## Status

Foundation-phase skeleton. No pipeline stage is implemented. The shape
is in place for evaluation; provider wiring is a separate decision.
