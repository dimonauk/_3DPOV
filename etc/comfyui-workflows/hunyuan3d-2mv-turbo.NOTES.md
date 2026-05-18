# hunyuan3d-2mv-turbo

Hunyuan3D-2 multi-view turbo image→GLB. Produces a ~15 MB textured mesh
in ~53 seconds on the Hangar bench (3080 Ti, 12 GB VRAM). Used for
stage furniture and AR props on the site.

## What it generates

A binary GLB via the Hunyuan3D saver node, walking 6 implicit views
from a single reference image at 512 px. Octree resolution 256 — the
turbo sweet spot between detail and memory.

## Source

**Found locally** at
`D:\The_Hangar\engines\comfyui\workflows\hunyuan3d_mv_turbo_i2_3d.json` —
ported verbatim with `_meta.title` added to every node and the
filename prefix changed to `holoflow_hy3d_2mv_turbo`.

## Required ComfyUI installs on the bench

- **Model — checkpoint** —
  `models/checkpoints/hunyuan3d-dit-v2-mv-turbo_fp16.safetensors`
  (Tencent's Hunyuan3D-2-mv turbo variant).
- **Custom node** —
  [`ComfyUI-Hunyuan3DWrapper`](https://github.com/kijai/ComfyUI-Hunyuan3DWrapper)
  (kijai). Provides `Hunyuan3dImageTo3D` and `Hunyuan3dSaveGLB`.
- **Custom node** — `ImageResize+` from
  [`ComfyUI_essentials`](https://github.com/cubiq/ComfyUI_essentials).
  Already installed on the Hangar bench
  (`custom_nodes/comfyui_essentials/`).

## Server mutation contract

- **Positive prompt** → node `"3"` (CLIPTextEncode — **metadata-only** for
  Hunyuan3D, which conditions on the image, not text. The text node is
  there purely to satisfy the server's "every workflow has a prompt"
  contract. The prompt is recorded in `sourceRef.comfyui.prompt` so the
  asset metadata still carries the operator's intent.).
- **Negative prompt** → no negative node; server's negative-mutation
  step is a no-op.
- **Seed** → node `"5"` has `inputs.seed = 42` but `Hunyuan3dImageTo3D`
  is NOT a `KSampler*` class, so the server's auto-seed-mutation rule
  does NOT fire. **The caller must pass an explicit override** to
  randomise:
  ```ts
  { params: { "5": { "seed": Math.floor(Math.random() * 2**32) } } }
  ```
- **Image input** — the caller must replace node `"2"`'s `image` field:
  ```ts
  { params: { "2": { "image": "uploads/<some-path-the-bench-can-read>.png" } } }
  ```
  ComfyUI resolves `image` against `ComfyUI/input/` unless prefixed.
  For URL-based input, swap node `"2"` to `LoadImageFromUrl`
  (from `ComfyUI-Custom-Scripts`) or download to `input/` before
  submitting.
- **Free-form params** — `{ "5": { "octree_resolution": 384, "steps": 30 } }`
  for higher-fidelity meshes (slower; closer to ~120 s).

## Output node

- **Node id**: `"6"`
- **Class**: `Hunyuan3dSaveGLB`
- **Key**: `mesh[0]` or `meshes[0]` (server checks both) → `.glb` file
