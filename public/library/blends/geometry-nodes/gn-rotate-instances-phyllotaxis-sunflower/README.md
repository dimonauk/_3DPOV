# GN Rotate Instances — Phyllotaxis Sunflower Array

**Blender:** 5.1 · **Topic:** Geometry Nodes · **Licence:** CC0

## What this builds

A mathematically exact sunflower disc: 144 seed instances arranged by the
**Golden Angle** (≈ 137.508°) and aligned radially outward by `RotateInstances`.
The result contains 89 clockwise and 55 counter-clockwise Fibonacci spirals —
the same pattern you find in an actual sunflower (*Helianthus annuus*) head.

## Why the Golden Angle works

Positioning the *n*th element at polar coordinates (√n · c, n · α) where
α = 2π(2 − φ) ≈ 2.4000 rad gives **uniform density** for any seed count.
Any rational approximation of α creates radial spokes because angular steps
eventually repeat; α is maximally irrational (continued fraction [1;1,1,1,…])
so no two seeds ever share a radial spoke direction.

## Key nodes

| Node | Role |
|---|---|
| `GeometryNodePoints` | Creates COUNT points at origin |
| `GeometryNodeInputIndex` | Per-point integer index |
| `ShaderNodeMath` (×, √, cos, sin) | Polar → Cartesian field maths |
| `GeometryNodeSetPosition` | Scatter points into disc |
| `GeometryNodeInstanceOnPoints` | Place seed mesh at each point |
| `GeometryNodeRotateInstances` | Align each seed radially (world Z) |
| `GeometryNodeRealizeInstances` | Bake instances for GLB/Draco export |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — builds scene + GN tree + exports |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Usage

```bash
blender --background --python blueprint.py
blender phyllotaxis_sunflower.blend --background --python record.py
```

## Cross-references

- Studio tutorial: `/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower`
- Related: `/tutorials/blender-tutorial-gn-instance-on-points`
- Related: `/tutorials/blender-tutorial-gn-scale-instances-spine-growth`
- Related: `/tutorials/blender-tutorial-gn-accumulate-field-spiral-staircase`

## Outside sources

- Blender Rotate Instances Node docs — CC-BY-SA 4.0, Blender Foundation
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/rotate_instances.html
- Vogel H. (1979) "A better way to construct the sunflower head" — public domain
  *Mathematical Biosciences* 44(3–4): 179–189
