# GN Scene Time + Rotation Socket — Procedural Mechanical Clockwork

**Blender 5.1 · CC0 · Holoflow Studio**

Two meshing gears and a pendulum animated without a single keyframe — only a
`Scene Time` node and the Blender 5.1 `Rotation` socket.

## What this demonstrates

| Technique | Why it matters |
|---|---|
| `GeometryNodeInputSceneTime` → `Frame` / `Seconds` | Keyframe-free procedural time in GN |
| `FunctionNodeEulerToRotation` | Explicit Rotation socket (4.3+) vs implicit Vector |
| `GeometryNodeTransform` driven by Rotation socket | Non-destructive live rotation on any mesh |
| Gear ratio law applied inside GN | `ω_small = −ω_big × (T_big / T_small)` |
| `Math(SINE)` on `Seconds` for the pendulum | FPS-independent isochronous swing |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene: gear meshes (bmesh), GN modifier construction, material, GLB export |
| `record.py` | EEVEE Next viewport capture → `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

```bash
blender --background --python blueprint.py
```

The script rebuilds from scratch, adds GN modifiers on three objects (gear\_big,
gear\_small, pendulum), and exports `clockwork.glb` alongside the `.blend`.

## Gear ratio

```
T_big  = 20 teeth,  R_big  = 1.00 m
T_small = 12 teeth, R_small = 0.60 m   ← pitch-circle tangency: R_big × T_small / T_big

ω_big   = +APF_BIG  = +2π/20 rad·frame⁻¹  (CCW)
ω_small = −APF_BIG × 20/12 = −2π/12 rad·frame⁻¹  (CW, faster)
```

## Outside sources

- **Blender Manual — Scene Time node**
  CC-BY-SA 4.0 · Blender Foundation ·
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/scene_time.html>
  Related: all GN Input / Scene nodes

- **Blender Manual — Euler to Rotation node**
  CC-BY-SA 4.0 · Blender Foundation ·
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/rotation/euler_to_rotation.html>
  Related: Rotate Rotation, Axis Angle to Rotation

## Licence

CC0 — public domain dedication. No attribution required.
