# GN Accumulate Field — Parametric Spiral Tower

**Topic:** Geometry Nodes — `GeometryNodeAccumulateField`  
**Blender:** 5.1  **Licence:** CC0  
**Tutorial:** [/tutorials/blender-tutorial-gn-accumulate-field-spiral-tower](/tutorials/blender-tutorial-gn-accumulate-field-spiral-tower)

## What this builds

Twenty-eight crystal pillars arranged on a Fermat spiral.  Each pillar's
height grows linearly with its index.  The floor Z of every pillar is the
exact cumulative sum of all preceding pillar heights — computed in a single
GN **Accumulate Field** node with no loop, no Repeat Zone, no simulation.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless bpy script — builds scene, wires GN tree, exports GLB |
| `record.py` | Animates Pillar Count 1→28 and renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `spiral_tower.blend` | *(generated)* live GN modifier, editable |
| `spiral_tower.glb` | *(generated)* static mesh for Three.js / WebXR |

## Running

```bash
# Headless build + export
blender --background --python blueprint.py

# Viewport animation render (requires spiral_tower.blend from above)
blender --background spiral_tower.blend --python record.py
```

## Key technique

`AccumulateField` takes a per-point field expression as its **Value** input.
It evaluates the expression once per domain element in index order and
returns three separate field outputs:

- **Leading** — prefix sum *before* the current element (`Σ hⱼ` for `j < i`)
- **Trailing** — prefix sum *including* the current element
- **Total** — grand sum over the entire domain

For this tower: `step_height_i = BASE_HEIGHT + i × HEIGHT_GROWTH`.
`Leading_i` is the floor Z of pillar *i*.  The pillar midpoint is
`Leading_i + step_height_i / 2`, which is fed to `SetPosition`.
Unit cones are then instanced with `Scale.Z = step_height_i`.

## Outside sources

- Blender Manual — Accumulate Field Node, CC-BY-SA 4.0, Blender Foundation  
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/accumulate_field.html>
- Jacques Lucke — Geometry Nodes Fields RFC (devtalk.blender.org), CC-BY-SA  
  <https://devtalk.blender.org/t/geometry-nodes-fields/14042>
