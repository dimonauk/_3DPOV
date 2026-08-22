# GN Smooth by Angle — Normal Split for Faceted and Hard-Surface Meshes

**Blender 5.1 | CC0 | Holoflow Studio**

## What this does

Blender 4.1 removed `bpy.types.Mesh.use_auto_smooth` and `auto_smooth_angle`.
This entry demonstrates the replacement: `GeometryNodeSmoothByAngle` wired
into a custom Geometry Nodes modifier tree, and the simpler
`'SMOOTH_BY_ANGLE'` modifier for quick migration.

The prism mesh has two classes of dihedral angle:
- **Side-to-side** ≈ 22.5° (360 ÷ 16 sides)
- **Cap-to-side** = 90°

At `Smooth Angle = 30°`: sides smooth, caps sharp — the most common
real-world WebXR asset profile.  
At `Smooth Angle = 15°`: both classes exceed the threshold — fully faceted.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds prism + GN modifier, exports two GLBs |
| `record.py` | Keyframes the Angle socket, renders viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |

## Expected artefacts

- `smooth_prism.blend`
- `smooth_prism_30deg.glb`
- `smooth_prism_15deg.glb`
- `public/library/videos/geometry-nodes/gn-smooth-by-angle-normal-split/viewport.mp4`
- `public/library/videos/geometry-nodes/gn-smooth-by-angle-normal-split/screen.mp4`

## Tutorial page

`/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split`

## Key pitfalls

1. `SetShadeSmooth(domain='FACE', smooth=True)` MUST precede
   `SmoothByAngle`. Without it there is no smooth baseline and the node
   has no effect.
2. `export_apply=True` is mandatory in the GLB export call. Without it
   the modifier is not baked and `sharp_edge` attributes never reach the
   glTF exporter.
3. `mod["Input_2"]` addresses the Angle socket when using `"SMOOTH_BY_ANGLE"`
   modifier type. The internal socket identifiers start at `"Input_1"` for
   the first non-geometry interface socket.
