# python-bpy-depsgraph-object-instances-gn-scatter-webxr-export

**Blender 5.1 · Python scripting · Depsgraph instance resolution**

Builds a Geometry Nodes point scatter in Python, iterates
`depsgraph.object_instances` to collect every virtual GN-produced copy,
world-transforms each via `inst.matrix_world`, merges all geometry into
a single bmesh, and exports one static Draco-compressed GLB for WebXR.

## What you build

A flat 5 m × 5 m ground plane scattered with ≈75 low-poly icosphere
props (density 3 pts/m², seed 42). The resolved static mesh ships as
`hf_scatter_resolved.glb` — a single merged mesh with no modifier stack,
suitable for collision-volume sampling or environment decoration in
Three.js / Babylon.js.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full pipeline: scene → GN tree → depsgraph resolve → GLB |
| `record.py` | Turntable camera render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest + cross-reference list |

## Run

```bash
blender --background --python blueprint.py
blender --background hf_depsgraph_scatter.blend --python record.py
```

## Key API

| Call | Purpose |
|---|---|
| `bpy.context.view_layer.update()` | Force full depsgraph re-evaluation |
| `bpy.context.evaluated_depsgraph_get()` | Snapshot of the current dep graph |
| `depsgraph.object_instances` | Iterator: all virtual copies + base objects |
| `inst.is_instance` | True only for GN/particle/collection copies |
| `inst.matrix_world` | World matrix for **this specific copy** |
| `inst.object.evaluated_get(depsgraph)` | Evaluated prototype (read-only) |
| `ob_eval.to_mesh()` / `to_mesh_clear()` | Safe temporary mesh snapshot pair |
| `bmesh.ops.transform(bm, matrix, verts)` | In-place vertex transform |

## Licence

CC0 — no rights reserved.
Outside references are credited in `.expected-artefacts.json` and the
tutorial at `/tutorials/blender-tutorial-python-bpy-depsgraph-object-instances-gn-scatter-webxr-export`.
