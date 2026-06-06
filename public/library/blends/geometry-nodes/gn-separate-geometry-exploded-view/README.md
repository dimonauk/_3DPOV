# GN Separate Geometry — Procedural Dissection and Exploded-View Animation

**Blender 5.1 · Geometry Nodes · CC0**

Splits a UV sphere at the equatorial plane into two live geometry halves using
`GeometryNodeSeparateGeometry`, assigns distinct materials, then lifts the upper
shell by a BoundingBox-derived offset driven by an animated `Explode_Gap` socket.

## Key concepts

| Node | Role |
|------|------|
| `GeometryNodeSeparateGeometry` | Returns two outputs: selected + inverted complement |
| `GeometryNodeBoundingBox` | Measures Max.Z of the upper half for adaptive lift distance |
| `GeometryNodeTransformGeometry` | Applies the Z-translation field to the upper shell |
| `GeometryNodeSetMaterial` | Assigns amber/teal materials to each half independently |
| `FunctionNodeCompare` | Z > 0 boolean field drives the separation selection |

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full headless build — mesh + GN tree + animation + GLB export |
| `record.py` | EEVEE animation render → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `dissection_exploded.blend` | Output blend (after running blueprint.py) |
| `dissection_exploded.glb` | GLB snapshot at frame 30 (mid-dissection) |

## Run order

```bash
# In Blender Scripting workspace:
# 1. Open blueprint.py → Run Script
# 2. Open record.py   → Run Script
```

## Outside sources

- Blender Manual — Separate Geometry Node: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/separate_geometry.html (CC-BY-SA 4.0, Blender Foundation)
- glTF-Blender-IO: https://github.com/KhronosGroup/glTF-Blender-IO (Apache-2.0, Khronos Group)
- njanakiev/blender-scripting: https://github.com/njanakiev/blender-scripting (MIT, Nicolas Janakiev)
