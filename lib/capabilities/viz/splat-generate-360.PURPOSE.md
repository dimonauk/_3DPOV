# `viz.splat-generate-360` — Generate a Gaussian Splat from 360-camera capture

Sibling capability to `viz.splat-generate`, scoped to spherical-camera
sources: DJI Avata 360, DJI Osmo 360, Insta360 X-series, Ricoh Theta,
GoPro Max.

## The wedge

DJI Terra Flagship handles splats but only for Matrice/Mavic pinhole
rigs ($2,800–4,400). Mipmap3D has no spherical support at $30/mo. The
consumer 360 drones DJI ships in 2026 — Avata 360 (launched 2026-03-26)
and Osmo 360 — have no first-party splat pipeline that respects the
dual-fisheye sensor honestly. Existing OSS treats the stitched output
as ground truth, which leaks stitch-seam artefacts into the splat.

This capability is the surface for the Hangar's answer to that gap.

## Why sibling, not a provider on `splat-generate`

The existing `viz.splat-generate` carries:

  - source kinds: `image-single | image-set | video | luma-ref`
  - providers:   `sharp-onnx | postshot | studio-rig-native | luma-genie`

A 360 capture brings two new shapes that don't fit cleanly:

  - **`fisheye-pair`** — two correlated DNG files per shot with a known
    rig constraint. Neither `image-single` nor `image-set` matches.
  - **`equirect-*`** — superficially the same as `image-set` / `video`
    but the SfM stage must use a spherical camera model. The existing
    providers assume pinhole.

Folding 360 into `splat-generate` early would either pollute the type
surface or force a runtime branch deep inside each provider. Keeping
this sibling means changes here cannot regress the existing capability,
and the two can merge later once the input shape has settled.

## Provider track

| Provider | Source | Licence | Service |
|---|---|---|---|
| **hangar-360** | fisheye-pair / equirect-* | `commercial-ok` | `D:/The_Hangar/engines/splat360/` (port 8390) |

All upstream OSS in the `hangar-360` path is commerce-safe: COLMAP
(BSD-3), GLOMAP (BSD-3), gsplat (Apache-2.0), Brush (MIT). No
`apple-amlr` contamination is possible on this capability — the
licence field is fixed to `commercial-ok` by `PROVIDER_LICENCE_360`.

## The three camera-model strategies

| Strategy | COLMAP model | When |
|---|---|---|
| `fisheye-pair` | `OPENCV_FISHEYE` per lens, rig-coupled | RAW DNG pair source available. Highest quality. |
| `equirect`     | `SPHERICAL` | Stitched video / stills, convenience > quality. |
| `cubemap`      | `PINHOLE` × 6 faces | Forced when the trainer refuses spherical input. |
| `auto`         | derived from source.kind | Default. |

The decision rule lives on the service side at
`D:/The_Hangar/engines/splat360/src/splat360/pipeline/camera_model.py`.

## Connection to HoloWalk

Natural downstream consumer. A sculpture captured with Avata 360 in
situ becomes a splat anchored at the GPS where it was shot — the exact
HoloWalk pattern. The Hangar service preserves the GPS prior through
SfM (rather than discarding it as nerfstudio's default equirect path
does), so the resulting splat is already geo-referenced when it lands.

## Status

Foundation-phase. `splat-generate-360.ts` defines the type surface
plus a stub router that throws `provider-unavailable`. Distinct from
the parent `viz.splat-generate` capability because the 360 pipeline
has a different camera-model decision (equirect / dual-fisheye /
180°) that influences the SfM front-end before the gsplat trainer
sees a frame.

Pending wires for the single planned provider:

- **hangar-360** — needs the `splat360` Hangar engine to land
  `pipeline.camera_model.decide`, `pipeline.sfm.run`, and
  `pipeline.train.run`. Network surface: `POST /api/jobs` on port 8390.
  Until those land, callers see `provider-unavailable`.

For non-360 video → splat work today, use `hangar-gsplat` via the
parent `viz.splat-generate` capability (the splat360 bench's
`/video3d/jobs` endpoint runs the standard gsplat trainer over
pinhole frames extracted from operator video).

## What the record carries

Same shape as `SplatRecord` deliberately — a downstream renderer
should not need to branch on which capability produced the splat.
The `meta` blob carries the diagnostic detail (camera path chosen,
registered image count, SfM reprojection error, train iters).
