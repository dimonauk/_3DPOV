# GN For Each Geometry Element — Hex Panel

**Blender 5.1 · CC0 · Holoflow Studio**

Procedural hexagonal panel where every cell is independently extruded to a
random depth using the **For Each Geometry Element** zone. Each hex receives
its own hue derived from a separate random stream, stored as a FACE-domain
`cell_colour` attribute that survives GLB export as a custom vertex accessor.

## Outputs

| File | Description |
|---|---|
| `blueprint.py` | Full bpy script — run in Blender's scripting console |
| `record.py` | Viewport animation render (cells rising 0 → full height) |
| `hex_panel.blend` | Saved scene with live GN modifier |
| `hex_panel.glb` | Flat-shaded, Draco-compressed, WebXR-ready |
| `../../videos/.../viewport.mp4` | Rendered animation (run record.py) |
| `../../videos/.../screen.mp4` | OBS screen recording (see SCREEN-RECORDING-NOTES.md) |

## What the For Each zone does

The Repeat zone runs the same sub-graph N times on the **whole mesh**.
The For Each zone runs a sub-graph once **per element**, with a fresh
context for each cell. Inside, the Element Index becomes the random seed
so each face gets a deterministic, unique extrusion depth and hue.

## Running the blueprint

```bash
blender --background --python blueprint.py
```

Or paste into Blender's Text Editor (Scripting workspace) and press
**Run Script**.  The GLB lands at the same folder as the .blend file.

## WebXR notes

- `export_yup=True` — +Y up, Holoflow convention
- `export_draco_mesh_compression_level=6`
- `cell_colour` appears as `_CELL_COLOUR` in the glTF binary accessor

Read the attribute in Three.js:
```js
const colAttr = geometry.getAttribute('_CELL_COLOUR'); // Float32Array, itemSize=4
```

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-gn-for-each-element-hex-panel`
- Related: `gn-dual-mesh-voronoi-sphere` (same Dual Mesh base topology)
- Related: `gn-repeat-zone-crystal-cluster` (compare Repeat vs For Each)
- Related: `gn-mesh-island-per-island-colour` (per-island vs per-element)
- Blender Manual — For Each Geometry Element
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/for_each_geometry_element.html
  CC-BY-SA 4.0 · Blender Documentation Team
- glTF-Blender-IO (Khronos Group)
  https://github.com/KhronosGroup/glTF-Blender-IO · Apache-2.0
