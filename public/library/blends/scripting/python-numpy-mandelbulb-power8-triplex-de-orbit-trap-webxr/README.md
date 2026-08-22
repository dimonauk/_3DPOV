# Mandelbulb Power-8 — Triplex Distance Estimation & Orbit-Trap Vertex Colours

**Topic**: scripting | **Blender**: 5.1 | **Licence**: CC0

## What this produces

`hf_mandelbulb.glb` — a watertight mesh of the power-8 Mandelbulb set at
exterior distance shell DE = 0.012, with RGB vertex colours derived from three
orbit-trap distances (Z-axis, XY-plane, unit sphere). Ready for WebXR.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full generation script — run in Blender's Script Editor |
| `record.py` | Viewport animation render (camera orbit, EEVEE Next) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for the screen.mp4 |
| `.expected-artefacts.json` | Expected outputs for CI/manifest checks |

## How to run

1. Open Blender 5.1. Go to the Scripting workspace.
2. Ensure `scikit-image` is installed in Blender's Python:
   ```
   Blender Python → pip install scikit-image
   ```
   (On Windows: `"C:\Program Files\Blender Foundation\Blender 5.1\5.1\python\bin\python.exe" -m pip install scikit-image`)
3. Open `blueprint.py` in the Script Editor.
4. Optionally adjust `GRID_N` (lower = faster, lower detail; try 48 for a quick preview).
5. Click **Run Script** (▶). Expect ~60–90 s at `GRID_N = 72`.
6. The GLB exports to the same folder as the `.blend` file (or `/tmp/` if unsaved).

## Technical summary

- **Triplex iteration**: z → z^8 + c using White-Rudy spherical-coordinate exponentiation
- **Distance estimation**: track |dz/dc| alongside |z|; DE = |z| log|z| / (2|dz/dc|) when escaped
- **Grid**: 72³ voxels over [−1.25, 1.25]³ → 373 K sample points
- **Isosurface**: scikit-image marching cubes at DE = 0.012
- **Orbit traps**: three geometric loci measured per orbit, trilinear-interpolated to mesh vertices
- **Export**: Draco-6 + WebP, `holoflow:facet = True`

## Parameters to explore

| Parameter | Effect |
|---|---|
| `POWER = 8` | Try 4, 6, 12 for different bulb morphologies |
| `GRID_N = 72` | 48 = quick preview; 96 = high fidelity (~4 min) |
| `MAX_ITER = 64` | Fewer iterations = thicker shell; more = sharper |
| `ISO_DE = 0.012` | Larger value = thicker exterior shell |
| `SCALE = 2.0` | World-space size in metres |

## Attribution

Formula: White, D. & Rudy, J. (2007–2009). Mathematical content; public domain.  
DE algorithm: triplex extension of the Mandelbrot DE (Auer-Lyne 1999).  
Fragmentarium (BSD-2-clause) by Mikael Hvidtfeldt Christensen for reference GLSL impl.
