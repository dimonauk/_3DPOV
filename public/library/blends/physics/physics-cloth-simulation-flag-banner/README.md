# Physics — Cloth Simulation: Flag Banner Blowing in Wind (Blender 5.1)

A fabric flag pinned at the hoist column, billowing under a turbulent Wind
force field, colliding with a metal pole and the ground.

## Outputs

| File | Description |
|---|---|
| `cloth_flag_banner.blend` | Fully animated scene (60 frames, cached) |
| `cloth_flag_banner.glb` | Static mesh snapshot at frame 30 (Draco L6, WebP) |
| `viewport.mp4` | Rendered viewport animation (run `record.py`) |
| `screen.mp4` | OBS screen capture (see `SCREEN-RECORDING-NOTES.md`) |

## Parameters (top of `blueprint.py`)

| Constant | Default | Notes |
|---|---|---|
| `GRID_W / GRID_H` | 2.0 / 1.2 m | Flag dimensions |
| `GRID_SEGS_X / Y` | 32 / 20 | Mesh resolution — raise for finer ripples |
| `CLOTH_MASS` | 0.15 kg/m² | Lightweight polyester; silk ≈ 0.07, canvas ≈ 0.5 |
| `TENSION_K` | 15 N/m | Structural stiffness — raise for stiffer fabric |
| `SHEAR_K` | 5 N/m | In-plane shear resistance |
| `BEND_K` | 0.5 N/m | Near-zero for real flags; >80 = paper |
| `WIND_STRENGTH` | 8.0 | Force field strength |
| `WIND_NOISE` | 2.5 | Turbulence amplitude — raise for chaotic gusts |
| `BAKE_FRAMES` | 60 | Simulation length |
| `SNAPSHOT_FRAME` | 30 | Frame for static GLB export |

## Key Concepts

- **Spring-mass cloth**: vertices = masses, edges = springs (tension/compression/shear/bending)
- **Pinning**: vertex group weight 1.0 = infinite effective mass (fully anchored)
- **Wind effector**: applies face-normal drag proportional to (v_wind − v_cloth)²
- **Collision modifier**: required on every object the cloth must bounce off
- **Point cache**: stores per-frame vertex positions; `use_library_path=True` keeps cache alongside the .blend

## Blender Version

Blender 5.1 — no extensions required. Cloth modifier and point cache API unchanged from 4.x.

## Licence

CC0 — public domain. Credited to the Blender Foundation docs (CC-BY) for reference.
