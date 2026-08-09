# Lorenz Strange Attractor — RK4, Bishop-Frame Tube & Butterfly Poi Light Trail

**Category**: scripting · **Blender**: 5.1 · **Licence**: CC0

A complete blueprint for generating the Lorenz strange attractor as a poi light-trail mesh.
The Lorenz system is integrated by 4th-order Runge-Kutta; a Bishop parallel-transport frame
builds a smooth tube along 2 000 waypoints; three Blender shape keys encode the bifurcation
from stable fixed point (ρ=22) through classic chaos (ρ=28, basis) to high-Rayleigh vigorous
convection (ρ=200).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — integrate, build mesh, shape keys, export GLB |
| `record.py` | Automated viewport animation render to `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_lorenz_poi.blend` | Generated blend file (run blueprint.py to create) |
| `hf_lorenz_poi.glb` | Draco-6 GLB for WebXR (run blueprint.py to create) |

## Quick start

```bash
# Run in Blender 5.1 Scripting workspace
blender --python blueprint.py
# or open Scripting tab, load blueprint.py, press Run Script
```

## Mathematics

The Lorenz system (1963):

```
dx/dt = σ(y − x)
dy/dt = x(ρ − z) − y
dz/dt = xy − βz
```

Parameters: σ=10, ρ=28, β=8/3. Hopf threshold ρ_H ≈ 24.74.
Lyapunov dimension D_KY = 2 + λ₁/|λ₃| ≈ 2.062 (fractal — barely more than 2D).

## Expected artefacts

- `hf_lorenz_poi.blend` — Blender scene with mesh and shape keys
- `hf_lorenz_poi.glb` — WebXR-ready GLB (~480 KB Draco-compressed)
- `viewport.mp4` — 10 s 1080p orbit + shape-key demo (created by record.py)
- `screen.mp4` — full screen recording (created manually with OBS)

## Studio cross-references

- [Rössler Attractor RK4](/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting)
- [Halvorsen Attractor RK4](/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr)
- [Hénon Map Strange Attractor](/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr)

## Outside sources

- Lorenz, E.N. (1963). *Deterministic Nonperiodic Flow*. J. Atm. Sci. 20(2):130–141. [AMS Open Access](https://journals.ametsoc.org/view/journals/atsc/20/2/1520-0469_1963_020_0130_dnf_2_0_co_2.xml)
- Saltzman, B. (1962). *Finite Amplitude Free Convection as an Initial Value Problem*. J. Atm. Sci. 19(4):329–341. [AMS Open Access](https://journals.ametsoc.org/view/journals/atsc/19/4/1520-0469_1962_019_0329_fafcaa_2_0_co_2.xml)

---
*Holoflow Studio · Blender Expert Content Mill*
