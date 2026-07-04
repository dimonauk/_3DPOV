# GN Simulation Zone — Verlet Rope: Position-Based Dynamics Cable Physics

**Blender 5.1** · **CC0** · topic: geometry-nodes

## What this builds

A hanging rubber cable that swings under gravity, solved entirely inside a
Geometry Nodes Simulation Zone using Position-Based Dynamics. No rigid body,
no cloth solver, no Python. The cable exports directly to GLB without a bake
pass because the simulation state lives in named attributes on the curve
geometry carried by the zone's implicit body channel.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy build: GN tree, Verlet integration, Repeat Zone constraint loop |
| `record.py` | Workbench viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for `screen.mp4` |
| `verlet_rope.blend` | Generated .blend (run blueprint.py) |
| `verlet_rope_frame48.glb` | Mid-swing GLB snapshot, Draco 6, WebP |

## Quick start

```bash
blender --background --python blueprint.py
# → verlet_rope.blend + verlet_rope_frame48.glb

blender verlet_rope.blend --python record.py
# → viewport.mp4
```

## Parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `ROPE_POINTS` | 20 | Control point count; more = smoother but costlier |
| `ROPE_LENGTH` | 2.0 m | Vertical hang distance |
| `CONSTRAINT_ITERS` | 6 | Repeat Zone passes; higher = stiffer cable |
| `GRAVITY_Z` | −9.81 | m/s²; reduce for slow-motion feel |
| `DT` | 1/24 | Seconds per frame; increase frame rate for better stability |
| `ROPE_RADIUS` | 0.025 m | Tube cross-section |
| `INITIAL_SWING_X` | 0.7 m | Horizontal offset of lowest point (swing amplitude) |

## How Position-Based Dynamics works

Verlet integration encodes velocity as `pos - prev_pos`. Each frame:
1. `vel = pos - prev_pos`
2. `new_pos = pos + vel + (0, 0, g·dt²)`
3. Store `prev_pos ← pos` (before committing new_pos — ordering critical)
4. Apply distance constraints via Repeat Zone (Jacobi update per segment)
5. Override point 0 with anchor world position (hard pin constraint)

## Outside sources

- **Blender Manual: Simulation Zone** — CC-BY-SA 4.0, Blender Foundation
  https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
  sibling: https://github.com/blender/blender

- **Müller et al., "Position Based Dynamics" (2006)** — freely redistributed
  https://matthias-research.github.io/pages/publications/posBasedDyn.pdf
  sibling: https://github.com/InteractiveComputerGraphics/PositionBasedDynamics
