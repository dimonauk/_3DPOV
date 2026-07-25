# DFT Epicycles — Poi Path Phasors

**Topic**: Python scripting · Discrete Fourier Transform · animation  
**Blender version**: 5.1  
**Licence**: CC0 — place in the public domain  
**Library path**: `blends/scripting/python-dft-epicycles-poi-path-phasors-webxr/`

## What this does

`blueprint.py` decomposes a closed 2-D poi path into N rotating phasors
(epicycles) using the Discrete Fourier Transform, then builds a Blender
scene where each phasor is a rotating arm. The tip of the arm chain traces
the original path — the animated equivalentof Fourier's theorem made visible.

The source path is `z(t) = exp(2πit) + 0.5·exp(−4πit)` — a poi petal/antispin
pattern built from exactly two harmonics. With N_H ≥ 3, the DFT reconstruction
is exact (within floating-point). With N_H = 1 or 2, you see how the path
degrades as harmonics are removed.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main Blender Python script — builds the animated scene |
| `record.py` | Viewport OpenGL capture → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable output manifest |

## Quick start

1. Open Blender 5.1 → **Scripting** workspace
2. Open `blueprint.py`, press **Run Script**
3. Switch to **Layout** workspace, set shading to **Material Preview**
4. Press **Space** — watch the epicycle chain spin and the orange trace curve build

## Key parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| `N_SAMPLES` | 256 | DFT resolution — more samples → smoother path |
| `N_H` | 10 | Epicycles to show — reduce to 2 to see aliasing |
| `FRAMES` | 180 | One full period = 6 s at 30 fps |
| `SOURCE_PATH` | poi petal | Replace with any `cmath` expression |

## Attribution

- Python `cmath` module — PSF Licence (BSD-compatible)  
  https://docs.python.org/3/library/cmath.html
- Blender Manual — Keyframe Animation (CC-BY-SA 4.0, Blender Foundation)  
  https://docs.blender.org/manual/en/5.1/animation/keyframes/introduction.html
