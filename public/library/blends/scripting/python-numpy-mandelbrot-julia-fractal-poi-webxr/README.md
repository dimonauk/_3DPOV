# Mandelbrot & Julia Fractal — Blender 5.1

**Topic**: Python numpy — Mandelbrot Set & Julia Sets via Escape-Time Algorithm  
**Blender**: 5.1 · **Licence**: CC0 · **Studio**: Holoflow Studio  
**Tutorial**: `/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr`

## What this does

`blueprint.py` computes the Mandelbrot set on a 256×256 grid using NumPy vectorised
complex arithmetic, maps smooth iteration counts to vertex colour (HSV cycling) and
Z-displacement, and exports two GLB files:

- `hf_mandelbrot.glb` — the classic Mandelbrot view with relief displacement
- `hf_julia.glb` — the Douady-rabbit Julia set (c = −0.7269 + 0.1889i)

A NURBS Curve (`hf_boundary_poi_path`) traces the Mandelbrot boundary — the
default poi light-painting trajectory for the studio.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main generation script — run in Blender Scripting workspace |
| `record.py` | Viewport animation script — produces `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest for CI checks |

## Quick start

1. Open Blender 5.1, `File > New > General`.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` and click ▶ **Run Script**.
4. Switch to **3D Viewport** (Z for Material Preview) to see the result.
5. Open `record.py` and run it, then **Render > Render Animation**.

## Technique notes

- **Smooth colouring**: `n − log2(log2(|z|))` removes integer-step banding.
- **Vectorised iteration**: 256² points iterated 128 times in ~6 s on a modern CPU.
- **Attribute domain**: `BYTE_COLOR` on `POINT` maps to `COLOR_0` in GLB —
  read in Three.js with `material.vertexColors = true`.

## Outside sources

- NumPy (BSD-3-Clause) — https://github.com/numpy/numpy
- Douady & Hubbard (1982), "Étude dynamique des polynômes complexes" — mathematical
  results, no licence required.
