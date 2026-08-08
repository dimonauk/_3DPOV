# Lorenz Attractor — RK4 Butterfly Orbit & Poi Light-Trail Tube Mesh

**Blender 5.1 · Python + numpy · CC0**

The Lorenz system (1963) is the canonical strange attractor: three nonlinear ODEs
in a deterministic system that produce aperiodic, fractal trajectories sensitive to
initial conditions. Two adjacent initial conditions diverge exponentially (Lyapunov
exponent λ₁ ≈ 0.906), yet both settle onto the same fractal butterfly attractor.

This entry integrates two orbits (wing A = blue-white, wing B = amber) using RK4
with dt=0.003, builds a tube mesh along each via Bishop parallel-transport, and
exports a Draco-6 GLB showing the double-wing structure for WebXR.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main Blender script — RK4, tube meshes, GLB export |
| `record.py` | Viewport animation recording rig (orbit camera + EEVEE bloom) |
| `README.md` | This file |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Artefacts produced

| File | Location |
|------|----------|
| `hf_lorenz.blend` | Alongside `blueprint.py` (save manually with Ctrl+S) |
| `hf_lorenz.glb` | Same directory (auto-written by script) |
| `viewport.mp4` | `public/library/videos/scripting/…lorenz…/viewport.mp4` |
| `screen.mp4` | Same videos folder (recorded with OBS) |

## Lorenz system

```
dx/dt = σ(y − x)     σ = 10
dy/dt = x(ρ − z) − y  ρ = 28
dz/dt = xy − βz       β = 8/3
```

Classic chaotic regime: Hausdorff dimension ≈ 2.06, Lyapunov exponent ≈ 0.906.

## How to run

1. Open Blender 5.1 → Scripting workspace.
2. Open `blueprint.py` → Run Script (Alt+P).
3. Two glowing tubes appear; `[Lorenz] Orbit A: 4500 verts` confirms success.
4. Run `record.py` → Ctrl+F12 to render 210-frame turntable.
5. Save `.blend` (Ctrl+S).

## Studio context

Full tutorial at `/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-butterfly-orbit-tube-poi-light-trail-webxr`

Licence: CC0. Mathematical content is in the public domain.
