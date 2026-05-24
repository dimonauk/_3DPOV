# GN Simulation Zone — Wave Reveal on Grid

**Blender 5.1 | CC0 | Holoflow Studio**
**Library path:** `public/library/blends/geometry-nodes/gn-simulation-zone-wave-reveal/`

## What this is

A Geometry Nodes Simulation Zone that propagates a radial "activation wave" across
a flat 20×20 grid over 120 frames. Each frame the zone increments a scalar Radius
state item by 0.025 m. Any vertex whose distance from the origin first falls inside
that radius receives `wave_time = scene_seconds`; the value is then frozen forever.

The EEVEE emission material reads the `wave_time` attribute via `ShaderNodeAttribute`,
normalises it, and maps it through a dark-navy → cobalt → cyan-white ColorRamp.
The result: an organic reveal from the grid's centre outward, useful as a WebXR
materialisation effect or a tutorial backdrop.

## Files

| File | Role |
|---|---|
| `blueprint.py` | Headless build — creates `.blend` + static GLB snapshot at frame 60 |
| `record.py` | Viewport animation render (wave expand over 120 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `wave_reveal_grid.blend` | Live `.blend` with Simulation Zone intact |
| `wave_reveal_grid.glb` | Draco-compressed GLB snapshot at frame 60 |

## Run

```bash
# Build blend + GLB
blender --background --python blueprint.py

# Render viewport.mp4 (requires wave_reveal_grid.blend from above)
blender --background wave_reveal_grid.blend --python record.py
```

## Simulation Zone structure

| State item | Type | Initial value | Role |
|---|---|---|---|
| `Geometry` | Geometry | Flat grid (wave_time all 0.0) | Carries per-vertex activation state |
| `Radius` | Float | 0.0 | Wave front radius; grows 0.025 m per frame |

## Key technique notes

- **Repeat Zone vs Simulation Zone** — the Repeat Zone runs N iterations *within
  one frame*; the Simulation Zone runs *once per frame* and its output becomes the
  next frame's input. Both use `pair_with_output()` and body channels, but the
  API property is `state_items` (not `repeat_items`) and the semantics are temporal.
- **Irreversible activation** — a double `GeometryNodeSwitch` ensures that once
  `wave_time > 0` for a vertex, subsequent frames never overwrite it. The outer
  switch gates on `was_active`; the inner switch gates on `just_reached`.
- **`GeometryNodeInputNamedAttribute`** — the correct node type for reading a
  named attribute INSIDE a GN tree. Not to be confused with `GeometryNodeNamedAttribute`
  (which is the legacy UI name). data_type='FLOAT' matches the POINT-domain float
  attribute created on the base mesh.
- **Headless simulation advance** — Simulation Zones cache state frame-by-frame.
  In headless mode `bpy.context.scene.frame_set(N)` only evaluates frame N using
  the cached state for frame N-1. The blueprint loops `range(1, GLB_FRAME+1)` to
  build the full cache chain before exporting.

## Licence

CC0 — place in the public domain. No attribution required.

## Tutorial

`/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal`
