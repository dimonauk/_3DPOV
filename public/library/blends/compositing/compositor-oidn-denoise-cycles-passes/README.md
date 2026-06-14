# Compositor — OIDN Denoise Node: Cycles Denoising with Normal + Albedo Passes

**Blender 5.1 · Holoflow Studio · CC0**

## What this teaches

How to use Blender 5.1's **Denoise compositor node** (powered by Intel OIDN)
with Normal and Albedo auxiliary passes to clean Cycles path-trace renders at
32 samples per pixel — quality equivalent to a 512+ spp path-trace at ~16×
less render time.

## Scene

A displaced sandstone sphere under three-point area lighting, rendered in
Cycles at 32 spp.  The compositor tree: **RenderLayers → Denoise (Normal +
Albedo inputs, ACCURATE prefilter) → Composite**.

The recording (`record.py`) renders 60 frames at 24 fps — first 30 with the
Denoise node muted (raw grain visible), last 30 denoised — for side-by-side
comparison.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene + passes + compositor setup (run in Text Editor, Alt+P) |
| `record.py` | Renders 60-frame comparison clip → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 |

## Quick start

1. Open Blender 5.1 → File › New › General.
2. Open Text Editor (Shift+F11), paste `blueprint.py`, press **Alt+P**.
3. Switch to the **Compositing** workspace — three nodes are ready.
4. Press **F12** — the denoised render appears in the UV/Image Editor.
5. Hover over the Denoise node, press **M** to mute it, press **F12** again.
   Compare the two results.

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `RENDER_SAMPLES` | 32 | spp before denoising — try 8 to stress-test the denoiser |
| `PREFILTER` | `'ACCURATE'` | `'NONE'` / `'FAST'` / `'ACCURATE'` — see docstring |
| `USE_HDR` | `True` | Preserve HDR range; set `False` only for LDR-clamped pipelines |
| `DISP_SCALE` | 0.10 | Displacement amplitude — higher = more occlusion = harder to denoise |

## Expected artefacts

- `stone_denoise.blend` — saved scene
- `render/stone_denoise_001.exr` — single DWAA-compressed EXR frame
- `videos/compositing/compositor-oidn-denoise-cycles-passes/viewport.mp4`

## Known limits

- **Caustics / glass fireflies**: OIDN cannot reconstruct unresolved caustic
  speckles — increase `GLOSSY_BOUNCES` or use Cycles' clamp settings.
- **Hair and SSS edges**: fine hair strands and subsurface-scattering boundaries
  can be slightly over-smoothed at very low spp (< 8).  Use ≥ 16 spp for hair.
- **Animated denoising flicker**: per-frame OIDN denoising can produce temporal
  flicker on animated sequences.  For production animations, use Cycles'
  built-in temporal denoiser (`scene.cycles.use_denoising = True`,
  `denoiser = 'OPENIMAGEDENOISE'`) which processes frames as a sequence.

## Licence

CC0 — no rights reserved.  Attribution appreciated but not required.

## Outside sources

- **Intel Open Image Denoise** — Apache-2.0 — Intel Corporation
  <https://github.com/OpenImageDenoise/oidn>
  Related Intel rendering projects: Embree (ray-tracing kernel), OSPRay
  (volumetric renderer) — all Apache-2.0.
- **Blender Cycles denoising documentation** — CC-BY-SA 4.0
  <https://docs.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html#denoising>
