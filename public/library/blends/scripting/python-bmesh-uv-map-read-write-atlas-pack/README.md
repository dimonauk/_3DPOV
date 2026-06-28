# Python — bmesh UV Map: Per-Face Planar Projection & Atlas Pack

**Blender 5.1 | Scripting | CC0 1.0**

Reads and writes per-loop UV coordinates via the `bmesh.loops.layers.uv` API,
then packs all per-face islands into a single 0-1 atlas.  The target use case
is Holoflow Studio's faceted low-poly pipeline: each flat face becomes its own
self-contained UV island, preventing cross-face texture bleeding in cel-shaded
WebXR materials.

## Quick start

1. Open Blender 5.1. File → New → General.
2. Open the Text Editor. Click **Open** and load `blueprint.py`.
3. Press **Alt + P** or click **Run Script**.
4. The script creates a flat-shaded icosphere, projects UVs per face, packs the atlas, and saves `bmesh_uv_atlas.blend`.
5. Open the UV Editor and inspect: every triangle should be a unique island with no overlaps.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full expert-grade script — bmesh UV layer read/write + atlas pack |
| `record.py` | Workbench render orbit animation (UV grid preview) → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest for library validation |

## Key API surface

```python
import bmesh

bm = bmesh.new()
bm.from_mesh(mesh)

# Create or get UV layer (lives on loops, not vertices)
uv_layer = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")

# Read
for face in bm.faces:
    for loop in face.loops:
        u, v = loop[uv_layer].uv   # mathutils.Vector(2)

# Write
loop[uv_layer].uv = Vector((0.5, 0.5))

# Commit
bm.to_mesh(mesh)
bm.free()
mesh.update()
```

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-python-bmesh-uv-map-read-write-atlas-pack`
- Related: [`python-bpy-bmesh-dodecahedron`](../python-bpy-bmesh-dodecahedron/) — bmesh mesh creation
- Related: [`uv-unwrap-low-poly-stylised`](../../uv-mapping/uv-unwrap-low-poly-stylised/) — operator UV workflow
- Holoflow exporter: `tools/blender-addon/holoflow_webxr_exporter/` — uses same UV layer pattern

## External sources

- [bmesh UV Types — Blender Python API](https://docs.blender.org/api/current/bmesh.types.html#bmesh.types.BMLayerCollection) (CC-BY-SA 4.0, Blender Foundation)
- [Three.js CylinderGeometry UV generation](https://github.com/mrdoob/three.js/blob/dev/src/geometries/CylinderGeometry.js) (MIT, Ricardo Cabello et al.)
