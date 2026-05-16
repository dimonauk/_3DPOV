# app/atelier/cube-composer/

A study-chamber visualisation of the CubeComposer paper (Tencent ARC,
CVPR 2026). The bench reference at `D:/The_Hangar/engines/CubeComposer/`
is a Python research codebase; this chamber is its web-side explainer.

## What this is

Not a voxel composer. The "Cube" in CubeComposer is the **cubemap** —
the six square faces around a viewer that together encode a 360°
spherical image. The paper's contribution is generating those faces
**one at a time, autoregressively across short temporal windows**,
which is how it can ship native 4K 360° video without melting GPU
memory.

The chamber renders the six cubemap faces as translucent panels
forming a sphere around the visitor, with a small cyan camera frustum
inside that flies along a recorded rotation trajectory. As frames
advance, the chamber lights up faces in the autoregressive order
(`front → right → left → back → up → down`), so the visitor can see
the loop the Python pipeline actually runs.

## What the source actually is

- `engines/CubeComposer/run.py` — entry point. Loads a `diffsynth`
  cache of Wan2.2 weights + a CubeComposer checkpoint from Hugging Face
  (`TencentARC/CubeComposer`), reads a trajectory JSON, iterates the
  ODVista360 test set, writes equirectangular videos + per-face cubemap
  frames to disk.
- `engines/CubeComposer/models/panorama_pipeline.py` — the `PanoramaWanPipeline`
  that drives the autoregressive face generation.
- `engines/CubeComposer/dataset/odv360.py` — wraps the ODV360 dataset.
- `engines/CubeComposer/diffsynth/` and `engines/CubeComposer/equilib/` —
  vendored copies of DiffSynth-Studio (the Wan2.2 host) and equilib
  (the equirectangular ↔ cubemap projection lib).
- `engines/CubeComposer/assets/trajectory_rotation_fov90_2wp_20samples.json`
  — sample camera trajectories. The chamber inlines a 27-frame subset of
  `video_id "003"` so it has no runtime fetch dependency.

The Python tool needs a CUDA box with Wan2.2 weights cached locally,
the ODVista360 dataset on disk, and a CubeComposer checkpoint. None
of that is portable to the browser; the visualisation is.

## What was ported

The **idea**, not the model:

- Cubemap topology (six faces around a viewer).
- Autoregressive face generation order across a temporal window.
- The included rotation trajectory (yaw/pitch/roll in degrees,
  decoded with three.js Euler in YXZ-ish order matching the
  equilib convention).
- Temporal window length 9 (matches `cubecomposer-3k`).

## Files

- `page.tsx` — server-component shell + `metadata`.
- `cube-composer-client.tsx` — `"use client"` R3F scene.

## Overlap with `/atelier/voxel-world`

None on the data side. `/atelier/voxel-world` is a discrete voxel
sculptor (1×1×1 cubes on an integer lattice); CubeComposer's "cube"
is a continuous cubemap projection. The two chambers share Tailwind
chrome and the `useActiveChamber` hook, nothing else.

## Logger

`createLogger("atelier:cube-composer")`. Two log lines:
- `debug` on temporal-window advance.
- `info` on trajectory reset.

## What this chamber DOES NOT do

- Run any diffusion model.
- Generate any 360° video.
- Upload any video to a backend.
- Touch the bench Python tool.

If a future iteration wants the real path, the bench tool needs to
be wrapped behind a Tailscale-Funnel'd FastAPI per `holoflow-bench-bridge`,
and the chamber needs an upload-video input + a polling viewer for
the generated equirectangular frames. None of that is in scope here.
