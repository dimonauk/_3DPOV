# GN Accumulate Field — Procedural Spiral Staircase

**Blender 5.1 · Geometry Nodes · CC0**

A 16-tread spiral staircase generated entirely by two `AccumulateField` nodes.
One accumulates a constant `RISE` value to produce cumulative step heights;
the other accumulates a constant `TWIST_RAD` to produce cumulative angles.
Together they form a helical placement scaffold without a single For-Each zone.

## Key technique

`GeometryNodeAccumulateField` is a prefix-sum field node.  Its `Leading` output
at element index `i` equals the sum of the `Value` field for all elements
`0..i-1`.  For uniform steps this matches `Index × RISE`, but the generalised
form handles non-uniform step spacing by swapping in any per-element field.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build + GLB export. Run via Blender's Text Editor or headless. |
| `record.py` | Renders `viewport.mp4` from the saved `.blend`. |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4`. |
| `.expected-artefacts.json` | CI manifest of expected output files. |

## Outputs

- `spiral_staircase.blend` — 16-tread helix, 96-frame orbit animation
- `spiral_staircase.glb` — Draco level 6, WebP textures, +Y up, Principled BSDF
- `public/library/videos/geometry-nodes/gn-accumulate-field-spiral-staircase/viewport.mp4`

## Parameters (top of blueprint.py)

| Name | Default | Effect |
|---|---|---|
| `STEPS` | 16 | Number of treads |
| `RISE` | 0.15 m | Height per step |
| `TWIST_PER_STEP_DEG` | 22.5° | Angular advance per step (22.5 × 16 = 360°) |
| `TREAD_WIDTH` | 0.80 m | Tread width |
| `TREAD_DEPTH` | 0.28 m | Radial tread extent |
| `INNER_RADIUS` | 0.22 m | Distance from Z axis to inner edge |

## Attribution

- Blender Manual — Accumulate Field: CC-BY-SA 4.0, Blender Documentation Team
- blender-python-scripts: MIT, Zach Noblitt (github.com/znoblitt/blender-python-scripts)
- glTF-Blender-IO: Apache-2.0, Khronos Group
