# GN Join Geometry + Transform Geometry — Faceted Lantern

**Blender 5.1 · CC0 · Holoflow Studio**

A three-part procedural lantern assembled entirely inside a single Geometry
Nodes modifier using **Join Geometry** and **Transform Geometry** — the
canonical pattern for multi-part props that must export as one GLB node.

## Parts

| Index | Part | Nodes used |
|---|---|---|
| 0 | Gem core | IcoSphere → SetShadeSmooth(False) → SetMaterialIndex(0) → TransformGeometry |
| 1 | Wire cage | IcoSphere → Wireframe → SetMaterialIndex(1) → TransformGeometry |
| 2 | Hex base | Cylinder(vertices=6) → SetShadeSmooth(False) → SetMaterialIndex(2) → TransformGeometry |

All three streams converge at a single **JoinGeometry** node. The result
is one mesh object with three material slots and correct per-face material
indices across the joined geometry.

## Outputs

| File | Description |
|---|---|
| `blueprint.py` | Full bpy script — run in Blender's scripting console |
| `record.py` | Viewport animation (360° spin + emission pulse) |
| `hf_lantern.blend` | Saved scene with live GN modifier |
| `hf_lantern.glb` | Three-material, Draco-compressed, WebXR-ready |
| `../../videos/.../viewport.mp4` | Rendered viewport animation |
| `../../videos/.../screen.mp4` | OBS screen recording |

## Running the blueprint

```bash
blender --background --python blueprint.py
```

Or paste into the Text Editor (Scripting workspace) and press **Run Script**.

## Key technique: Join Geometry attribute rules

When multiple streams enter `Join Geometry`, attribute merging follows
a strict rule: **if an attribute exists on stream A but not on stream B,
all elements from stream B receive zero-initialised values for that attribute.**

This is safe for `material_index` (always initialised to 0 on primitives)
because each stream's index is set before the join. It requires care for
custom attributes — if you store a `glow_factor` float on the gem stream
only, every cage and base face will have `glow_factor = 0.0` after joining.
Either store the attribute on all streams with appropriate sentinel values,
or read it with a `Named Attribute` node gated by `material_index`.

## Transform Geometry: node-space vs object-space

`Transform Geometry` moves a geometry stream **in the object's local space**,
before the GN result is evaluated into world-space by the modifier. Its
Translation/Rotation/Scale inputs accept field connections, which means you
can animate them by exposing them as group sockets and keyframing the modifier
property — no drivers required.

The critical failure mode: `Transform Geometry` with a group-socket Scale input
defaults to `(0, 0, 0)` if the socket has no connection and no default set.
Always set `default_value` on scale sockets explicitly, or the geometry collapses
to a point.

## WebXR delivery

- `export_yup=True` — +Y up, Holoflow convention
- `export_draco_mesh_compression_level=6`
- Three material slots appear as `materials[0..2]` in the glTF primitive
- Load in Three.js: `mesh.material` is an array when the GLB has multi-material primitives

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-gn-join-geometry-transform-multi-part-assembly-lantern-webxr`
- Related: `gn-set-material-index-voronoi-cell-zones` (material index patterns)
- Related: `gn-realize-instances-crystal-grotto` (instances vs joined geo)
- Related: `gn-separate-geometry-exploded-view` (inverse of join)
- Related: `gn-store-named-attribute-shader-data-bridge` (attribute preservation)
- Blender Manual — Join Geometry:
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/join_geometry.html
  CC-BY-SA 4.0 · Blender Documentation Team
- Blender Manual — Transform Geometry:
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/transform_geometry.html
  CC-BY-SA 4.0 · Blender Documentation Team
