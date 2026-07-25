# LBM D2Q9 — Kármán Vortex Street & Poi Wake (Blender 5.1)

**Slug**: `python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr`  
**Licence**: CC0  
**Blender**: 5.1  
**Topic**: scripting / physics simulation

## What this is

A Lattice Boltzmann Method (LBM) simulation running live inside Blender
via a `frame_change_pre` handler. Each frame one BGK collision + streaming
step advances the flow field. Vorticity is colour-mapped blue→white→red to
a per-vertex `FLOAT_COLOR` attribute on a 160×80 quad mesh; an emission
material makes the colours glow against a black background.

The Kármán vortex street — alternating counter-rotating vortices behind a
cylinder at Reynolds number Re ≈ 96 — begins developing around frame 80
and is fully periodic by frame 160.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full LBM setup + handler. Run once in Scripting workspace. |
| `record.py` | EEVEE render to `viewport.mp4` (300 frames, H.264). |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4`. |
| `hf_karman_vortex.blend` | Saved blend file after blueprint.py run. |

## How to run

1. Open Blender 5.1 → **Scripting** workspace.
2. Open `blueprint.py` → **Run Script**.
3. Switch 3D viewport to **Rendered** shading (EEVEE Next).
4. Press **Space** — watch the vortex street develop over ~80 frames.
5. File → Save As `hf_karman_vortex.blend`.

## Physics parameters

| Parameter | Value | Notes |
|---|---|---|
| Grid | 160 × 80 | 2:1 aspect; domain 6.4 m × 3.2 m |
| τ (relaxation time) | 0.55 | ν = (0.55−0.5)/3 ≈ 0.0167 l.u. |
| U_INFLOW | 0.10 l.u./step | Stable Ma ≈ 0.17 (< 0.3 limit) |
| Obstacle radius | 8 cells | D=16; blockage ratio 20% |
| Reynolds number | ≈ 96 | U × D / ν = 0.10 × 16 / 0.0167 |
| Strouhal number | ≈ 0.20 | Expected vortex shed period ≈ 80 frames |

## Stability notes

- Keep U_INFLOW ≤ 0.15 (Mach number Ma = U/c_s < 0.26 for stability;
  c_s = 1/√3 ≈ 0.577 in D2Q9 lattice units).
- TAU must satisfy 0.5 < τ < 2.0. Values very close to 0.5 give low
  viscosity (high Re) but amplify numerical instability.
- Periodic top/bottom walls (via `np.roll`) are fine for the vortex street
  provided the channel height is ≥ 5× the obstacle diameter (here: 80/16 = 5×).
