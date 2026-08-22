# GN Set Curve Tilt — Möbius Ribbon

**Blender 5.1 · Geometry Nodes · CC0**

Builds a Möbius strip (single-sided non-orientable surface) using the
`Set Curve Tilt` node driven by a `Spline Parameter` field.  Exports as a
GLB with Draco compression, ready for WebXR.

## What this teaches

- Why `Set Curve Tilt` rotates the profile around the curve tangent (not the world axis)
- How `Spline Parameter` Factor evaluates from 0 → 1 on a closed circle curve
- Why `Fill Caps = False` is mandatory for Möbius topology
- Generalising to N half-twists by changing `Twist Turns`

## Prerequisites

- Blender 5.1 installed
- Basic familiarity with the Geometry Nodes editor
- Completed: `gn-curve-to-mesh` tutorial (or equivalent)

## Run

```bash
blender --background --python blueprint.py
```

Outputs:
- `mobius_ribbon.blend` — live GN modifier with sliders
- `mobius_ribbon.glb` — Draco-compressed, ready for WebXR load

To render the 120-frame rotation video:

```bash
blender --background --python record.py
```

## Parameters

| Modifier Input | Default | Notes |
|---|---|---|
| Radius | 1.5 m | Loop size |
| Twist Turns | 1.0 | 1 = Möbius, 2 = cylinder, 3 = three-twist |
| Resolution | 128 | Segments around the circle |

Strip width is hardcoded at 0.70 m (±0.35 m from centre) in blueprint.py.

## File list

| File | Purpose |
|---|---|
| `blueprint.py` | Full procedural scene builder |
| `record.py` | 120-frame rotation render |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for screen.mp4 |
| `mobius_ribbon.blend` | Generated blend file |
| `mobius_ribbon.glb` | Generated GLB for WebXR |
