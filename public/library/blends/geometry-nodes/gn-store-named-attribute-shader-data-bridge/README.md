# GN Store Named Attribute → Shader Attribute Data Bridge

**Blender 5.1 | CC0 | Holoflow Studio**

A Geometry Nodes modifier computes a per-vertex "edge heat" float (0 = panel
centre, 1 = perimeter) using a Chebyshev distance formula, then stores it in
the mesh data block under the name `edge_heat` via **Store Named Attribute**.
The hull panel's material reads it back with an Attribute node and uses it to
drive emissive intensity — no texture painting, no bake, no UV coordinates.

## Why this matters

`Capture Attribute` evaluates a field and makes the result available downstream
**inside the same node tree**.  `Store Named Attribute` writes the concrete
value into the mesh data block with a user-chosen name, making it available to
**any consumer that reads mesh attributes by name**: the shader editor's
Attribute node, Python's `mesh.attributes["edge_heat"]`, and glTF export's
`_edge_heat` vertex accessor.  This is the structural pattern behind the
Holoflow `holoflow:facet` per-object metadata flag.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full scene + GN tree + material + GLB export |
| `record.py` | Pulse animation render (72 frames, EEVEE Next) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI manifest |

## What blueprint.py builds

- **Hull panel**: `PANEL_DIVS=5` quad grid, 2 m × 2 m, with bevelled outer rim
- **GN modifier** (`EdgeHeatBridge`):
  - `Position` → `SeparateXYZ` → `Absolute(X)`, `Absolute(Y)` → `Maximum` → `Divide(1.0)` → `Clamp`
  - `StoreNamedAttribute` → name=`"edge_heat"`, domain=POINT, type=FLOAT
- **Material** (`hull_edge_heat_mat`):
  - `Attribute("edge_heat")` → Fac → `ColorRamp` → Multiply(3.2) → Emission Strength
  - Dark gunmetal base colour; cyan plasma glow at perimeter
- **GLB** with `export_attributes=True` — THREE.js reads `_edge_heat` as a vertex attribute

## Chebyshev distance formula

For a panel centred at origin with half-size `h`:

```
edge_heat = clamp(max(|pos.x|, |pos.y|) / h, 0, 1)
```

- Perimeter vertex at (1, 0): max(1, 0)/1 = 1.0
- Corner vertex at (1, 1): max(1, 1)/1 = 1.0 (same value — uniform edge)
- Centre vertex at (0, 0): max(0, 0)/1 = 0.0

All four edges read 1.0 at any point along their length, unlike Euclidean
distance which only peaks at corners.

## Attribute domain reference

| Domain | Storage | Shader reads | Notes |
|--------|---------|--------------|-------|
| POINT | per vertex | Attribute node, interpolated across faces | ✓ Best for gradients |
| FACE | per polygon | Attribute node, flat-shaded per polygon | Good for per-face labels |
| EDGE | per edge | Not directly in shader (no rasteriser mapping) | Use for GN logic only |
| CORNER | per face-corner | Attribute node (map via interpolation) | Good for UV-style data |

## Python inspection

```python
import bpy
dg   = bpy.context.evaluated_depsgraph_get()
mesh = bpy.context.active_object.evaluated_get(dg).data
attr = mesh.attributes["edge_heat"]
# attr.domain == 'POINT', attr.data_type == 'FLOAT'
vals = [d.value for d in attr.data]
print(min(vals), max(vals))  # expect ~0.0 … 1.0
```

## glTF accessor

When exported with `export_attributes=True`, inspecting the GLB JSON shows:

```json
"extras": {
  "_edge_heat": <accessor_index>
}
```

THREE.js r155+: `geometry.attributes['_edge_heat']` → `BufferAttribute(Float32Array)`.

## Cross-references

- [Capture Attribute tutorial](/tutorials/blender-tutorial-gn-capture-attribute-named-attribute) — within-tree field capture vs Store Named Attribute
- [Shader Edge Highlight (Pointiness + AO)](/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight) — same visual result via shader-only technique
- [Procedural Worn Metal Edge Wear](/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear) — edge wear driven by Geometry Pointiness node
- [Python Batch GLB Exporter](/tutorials/blender-tutorial-python-batch-glb-exporter) — export pipeline that reads custom attributes

## Outside sources

- Blender Manual — Store Named Attribute node: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/store_named_attribute.html (CC-BY-4.0, Blender Documentation Team)
- Blender Python API — bpy.types.Attribute: https://docs.blender.org/api/current/bpy.types.Attribute.html (CC-BY-SA 4.0, Blender Documentation Team)
