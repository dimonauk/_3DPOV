# Rössler Strange Attractor — Light-Painting Trails (Blender 5.1)

Eight poi-spinner trajectories seeded ε = 0.025 Rössler units apart, integrated
with 4th-order Runge–Kutta (h = 0.002), rendered as growing neon tube curves
on a pure-black EEVEE canvas.

The Rössler system (1976) has one nonlinear term — z·(x−c) — yet produces a
folded-band strange attractor with Kaplan–Yorke dimension ≈ 2.013.

## Quick start

1. Open Blender 5.1, Scripting workspace.
2. Open `blueprint.py` → **Run Script**.
3. Switch to 3D Viewport → Rendered shading → press **Space**.
4. Open `record.py` → **Run Script** to render `viewport.mp4`.
5. For screen.mp4: follow `SCREEN-RECORDING-NOTES.md`.

## Parameters

| Constant  | Default | Effect                                     |
|-----------|---------|--------------------------------------------|
| `A, B, C` | 0.2, 0.2, 5.7 | ODE params; c < 4.6 = periodic, c > 4.6 = chaotic |
| `N_TRAJ`  | 8       | Number of simultaneous trajectories        |
| `EPSILON` | 0.025   | Initial separation of seeds (Rössler units)|
| `N_FRAMES`| 480     | Recorded frames (= animation length)       |
| `SCALE`   | 0.035   | Rössler units → Blender metres             |

## Outputs

| File                | Description                          |
|---------------------|--------------------------------------|
| `hf_rossler.glb`    | Full-tube geometry, all 8 trails     |
| `viewport.mp4`      | 480-frame EEVEE animation (30 fps)   |
| `screen.mp4`        | OBS screen recording (see notes)     |

## Licence

CC0 — all original code. Equations from Rössler 1976 are mathematical facts.
