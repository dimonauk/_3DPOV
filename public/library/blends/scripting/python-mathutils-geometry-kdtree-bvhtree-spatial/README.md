# Python mathutils — KDTree & BVHTree Spatial Queries
**Blender 5.1 · CC0 · Scripting**

Demonstrates `mathutils.kdtree.KDTree` and `mathutils.bvhtree.BVHTree` —
Blender's two built-in spatial acceleration structures — by building a
surface-constellation effect: 64 random probes snapped to an icosphere using
BVH `find_nearest()`, then linked by nearest-neighbour edges found via KDTree.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene build + GLB export — run in Script Editor |
| `record.py` | Viewport animation render — run after blueprint.py |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

---

## Quick Start

1. Open Blender 5.1, new General file.
2. Open `blueprint.py` in the Script Editor (Text → Open).
3. Run script (`Alt-P`). Scene clears then builds anchor + constellation.
4. Inspect the result in Material Preview mode.
5. `spatial_constellation.glb` is written to the same directory as the `.blend`.

---

## Key Concepts

### KDTree vs BVHTree

| | KDTree | BVHTree |
|---|---|---|
| Queries | Vertex positions | Face geometry |
| API | `find_n(co, k)`, `find(co)`, `find_range(co, r)` | `ray_cast(origin, dir)`, `find_nearest(co)` |
| Build cost | O(n log n) | O(n log n) |
| Query cost | O(log n) | O(log n) |
| Returns | (co, index, dist) tuples | (location, normal, face_index, dist) |
| Use when | "Which vertex is closest?" | "What surface point is nearest?" / "Does this ray hit the mesh?" |

### `kd.balance()` is mandatory

`KDTree.balance()` partitions the internal binary tree.  Any `find*()` call
before `balance()` silently returns empty results — there is no error raised.
Always call `balance()` immediately after all `insert()` calls.

### Evaluated depsgraph for BVH

`BVHTree.FromObject(eval_obj, depsgraph)` resolves all modifiers before
building the hierarchy.  Using the base `obj.data` mesh instead would query
the un-modified cage — positions that may differ significantly from the
visible surface when a Subdivision Surface or Displace modifier is active.

### `find_nearest()` vs `ray_cast()`

`find_nearest(co)` — no direction needed; returns the globally closest face
point.  Use for surface snapping, particle attachment, and add-on proximity
detection.

`ray_cast(origin, direction)` — fires a ray from `origin` in `direction`;
returns the first hit face.  Use for decal projection, shadow casting tests,
and "is this point inside the mesh?" via odd/even ray counting.

---

## WebXR / Three.js Notes

The exported `spatial_constellation.glb` carries a `snap_dist` vertex colour
attribute on the constellation mesh.  In Three.js after `GLTFLoader`:

```js
const colAttr = mesh.geometry.attributes['snap_dist'];
// Float32Array, 4 components (RGBA) per vertex
```

The `export_colors=True` flag in `bpy.ops.export_scene.gltf` writes
`FLOAT_COLOR` attributes as a `COLOR_0` accessor in the glTF buffer.

---

## External References

- Blender Python API — mathutils module:
  https://docs.blender.org/api/current/mathutils.html
  Licence: CC-BY-SA 4.0 / Blender Foundation

- njanakiev/blender-scripting (MIT, Nicolas Janakiev):
  https://github.com/njanakiev/blender-scripting
  Spatial query patterns in Python scripting context.
