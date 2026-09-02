# Hyperchaotic Rössler 4D Attractor — WebXR Poi Head

**Blender 5.1 · Python + NumPy · Bishop Parallel-Transport Tube**

## What this is

The *hyperchaotic Rössler system* (Rössler 1979) is the minimal 4D autonomous
ODE that exhibits **two positive Lyapunov exponents** simultaneously.  This
property — called *hyperchaos* — means nearby trajectories diverge in two
independent directions at once, producing a double-sheet folding pattern that
no 3D system can replicate.

The blueprint integrates the four-dimensional system with RK4, projects the
trajectory onto the (x, y, z) subspace for the mesh, and encodes the fourth
coordinate **w** as a vertex colour attribute (`HC_Rossler_W`, cobalt–amber).
The resulting tube is exported as a WebXR poi head GLB.

## Equations

```
ẋ = −y − z
ẏ =  x + a·y + w
ż =  b + x·z
ẇ = −c·z + d·w

Basis  a = 0.25,  b = 3.0,  c = 0.5,  d = 0.05
```

## Lyapunov spectrum (canonical)

| Exponent | Value | Meaning |
|---|---|---|
| λ₁ | ≈ +0.155 | primary divergence direction |
| λ₂ | ≈ +0.033 | **second** divergence direction (hyperchaos) |
| λ₃ | ≈ 0 | orbit time direction |
| λ₄ | ≈ −14.3 | strong contraction |
| **D_KY** | **≈ 3.013** | Kaplan–Yorke fractal dimension |

## Shape keys

| Key | a | d | Behaviour |
|---|---|---|---|
| Basis | 0.25 | 0.05 | Canonical hyperchaos (two positive λ) |
| SK_LoD | 0.25 | 0.01 | d too small → near-periodic (hyperchaos lost) |
| SK_HiA | 0.35 | 0.05 | Stronger spiral → broader orbital radius |
| SK_HiD | 0.25 | 0.10 | Stronger 4D coupling → altered fold geometry |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Blender 5.1 bpy/bmesh build script |
| `record.py` | Viewport animation render (OpenGL, 240 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `hc_rossler_poi.blend` | Saved Blender file (run blueprint first) |
| `hc_rossler_poi.glb` | WebXR-ready GLB (Draco 6, WebP, shape keys) |

## Licence

Blueprint code: **CC0 1.0** — no rights reserved.  
Mathematical equations: public domain (Rössler 1979, >45 yr).

## References

- Rössler OE (1979) "An equation for hyperchaos".
  *Phys Lett A* **71**(2–3):155–157.
  DOI: [10.1016/0375-9601(79)90150-6](https://doi.org/10.1016/0375-9601(79)90150-6)

- NumPy: BSD-3-Clause — <https://numpy.org>

- Related attractor (3D Rössler 1976):
  [/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr](/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr)
