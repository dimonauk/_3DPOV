# Mandelbulb Power-8 — Triplex Algebra, Smooth Escape-Time & Sphere↔Bulb Shape-Key Poi Head

**Blender 5.1 · Python / NumPy · CC0**

The Mandelbulb is a 3D analogue of the Mandelbrot set created using the *triplex*
power operation proposed by Daniel White in 2007 and refined by Paul Nylander in
2009.  The power-8 version (`z^8 + c`) produces the characteristic bulb-with-tentacles
geometry — eight large lobes arranged around the equator, a polar cap at +z, and
increasingly fine filaments at higher iterations.

## What this entry builds

| File | Description |
|---|---|
| `blueprint.py` | NumPy-vectorised escape-time field, marching tetrahedra isosurface, Sphere↔Bulb shape keys, HSV height-gradient vertex colour, Draco-6 GLB export |
| `record.py` | 90-frame OpenGL animation: sphere morphs into Mandelbulb, camera orbits |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the `screen.mp4` capture |
| `../../glbs/scripting/<slug>/hf_mandelbulb.glb` | Draco-compressed GLB with morph targets |

## Technique summary

1. **Triplex power**: convert `z=(x,y,z)` to spherical `(r,θ,φ)`, compute
   `z^n = r^n·(sin nθ·cos nφ, sin nθ·sin nφ, cos nθ)`, add `c`.
2. **Smooth escape-time**: `smooth = i − log₂(log₂|z|)` removes the
   hard step between integer iterations, giving a continuous gradient field.
3. **Marching tetrahedra** (Doi & Koide 1991) on a 26³ grid covering
   `[−1.25, 1.25]³`; isosurface at threshold 0.5.
4. **Shape keys**: Basis = sphere projection, Mandelbulb = extracted surface.
5. **Vertex colour**: z-height → HSV sweep (violet bottom → red top).

## Parameters to adjust

| Constant | Default | Effect |
|---|---|---|
| `POWER` | 8 | 4 → cauliflower; 8 → classic Mandelbulb; 12 → finer filaments |
| `MAX_ITER` | 14 | More → sharper boundary; too high → slow |
| `N` | 26 | Grid resolution; 32 → finer mesh but ~2× slower marching loop |
| `POI_RADIUS` | 0.082 | Poi head size in metres |

## Licence
All code in this entry is **CC0** (public domain dedication).
Outside sources credited in the tutorial cross-references.
