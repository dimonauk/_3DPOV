# Lorenz Strange Attractor — Blueprint & Recording Guide

**Blender 5.1 · Python RK4 Integration · CC0 · Holoflow Studio**

Six Lorenz trajectories (σ=10, ρ=28, β=8/3) start within ε=0.01 of
each other and diverge exponentially across the butterfly strange
attractor.  After 8 time units, an initial separation of 0.01 has
grown to ~9 Lorenz units — the trajectories visit completely different
regions of the two-wing surface.  This is deterministic chaos: no
randomness, perfect ODEs, maximum unpredictability.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build the scene — run once via Scripting tab |
| `record.py` | Render `viewport.mp4` — run after blueprint in same session |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture guide for `screen.mp4` |

## Quick start

1. Open a new Blender 5.1 file.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py`, press **Run Script**.
4. Press **Space** to preview the animation in the 3D Viewport (set to Rendered/EEVEE).
5. Open `record.py`, press **Run Script** to render `viewport.mp4`.

## Physics parameters

| Constant | Default | Notes |
|----------|---------|-------|
| `SIGMA` | 10.0 | Prandtl number |
| `RHO` | 28.0 | Normalised Rayleigh number (> 1 = chaos regime) |
| `BETA` | 8/3 | Aspect-ratio term |
| `DT` | 0.002 | RK4 step (max stable ~0.02) |
| `N_SKIP` | 800 | Transient steps before recording |
| `N_FRAMES` | 400 | Animation frame count |
| `N_SUBSTEPS` | 10 | RK4 sub-steps per frame |
| `EPSILON` | 0.01 | Initial X₀ offset between trajectories |
| `N_TRAJ` | 6 | Number of trajectories |

## Expected artefacts

See `.expected-artefacts.json`.

- `hf_lorenz.blend` — saved scene with animated curves
- `hf_lorenz.glb` — full-trail GLB (bevel converted to mesh at frame 400)
- `viewport.mp4` — EEVEE render with neon butterfly and bloom
- `screen.mp4` — OBS capture of live Rendered viewport playback

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting`
- Related: Double Pendulum Chaos (same chaos series, 2D planar system)
- Related: BZ Oregonator (spiral waves — another deterministic chaos-adjacent system)
- Related: Points to Curves Poi Trail (curve + bevel technique)
