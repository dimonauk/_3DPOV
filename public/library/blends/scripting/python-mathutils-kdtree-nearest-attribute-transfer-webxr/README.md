# KDTree Nearest-Neighbour Attribute Transfer

**Blender 5.1 · Python scripting · WebXR pipeline**

`mathutils.kdtree.KDTree` is a compiled C k-d tree accessible directly from
Blender's Python environment. This tutorial builds a KDTree from a hi-res
source mesh, reads a custom FLOAT per-vertex attribute (simulating a Cycles
AO bake), and transfers it to a low-poly proxy via inverse-distance-squared
weighting. The result is written as FLOAT_COLOR and exported as a GLB with
a `COLOR_0` vertex-colour accessor for WebXR consumption.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Production script — creates both meshes, attributes, KDTree, transfer, export |
| `record.py` | Viewport animation — 90-frame turntable of the result for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest |

## Expected output

Running `blueprint.py` inside Blender 5.1 (Text Editor → Run Script or
`blender --background --python blueprint.py`) produces:

- `attr_transfer.blend` — scene file with both spheres and the FLOAT_COLOR attribute
- `attr_transfer.glb` — low-poly proxy with vertex colours, Draco-compressed, WebP

Running `record.py` against that `.blend` file produces `viewport.mp4`.

## Key concepts

- `mathutils.kdtree.KDTree(n)` — preallocated k-d tree; `n` is a capacity hint
- `kd.balance()` — mandatory before any `find*()` call; builds the internal structure
- `kd.find_n(co, k)` — returns `k` nearest (Vector, int, float) tuples by distance
- `mesh.attributes.new(name, type='FLOAT_COLOR', domain='POINT')` — vertex colour
- `attr.data.foreach_set("color", flat_rgba_array)` — bulk write at C speed
- `mesh.color_attributes.render_color_index` — controls which attribute becomes `COLOR_0`

## Related studio tutorials

- [mathutils.Matrix transforms](/tutorials/blender-tutorial-python-mathutils-matrix-transform-compose-decompose-webxr)
- [UV atlas pack & multi-object GLB](/tutorials/blender-tutorial-python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr)
- [Vertex group scripting & VRM deform](/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope)
- [Edge sharp / crease attributes](/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr)

## Outside references

- SciPy spatial algorithms (BSD-3-Clause) — https://docs.scipy.org/doc/scipy/reference/spatial.html
- NumPy array buffer pattern (BSD-3-Clause) — https://numpy.org/doc/stable/reference/generated/numpy.ndarray.tobytes.html
