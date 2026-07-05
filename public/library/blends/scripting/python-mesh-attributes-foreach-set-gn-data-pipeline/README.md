# Python Mesh Attribute API — foreach_set / foreach_get
## Blender 5.1 | Holoflow Studio | CC0

Build an attribute-painted icosphere planet with biome data written as
named mesh attributes via Python's bulk `foreach_set` / `foreach_get` API.
The attributes are readable in Geometry Nodes (Named Attribute node) and
exported as custom channels in the GLB for the holoflow WebXR runtime.

---

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full production script — build mesh, write attributes, export GLB |
| `record.py` | Viewport animation recorder — 90-frame camera orbit |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |
| `.expected-artefacts.json` | Expected output manifest |

### Expected outputs

| File | Notes |
|------|-------|
| `attribute_planet.glb` | Icosphere with altitude/is_peak/biome_id/face_colour attributes |
| `viewport.mp4` | 3-second orbit rendered by record.py |
| `screen.mp4` | Screen recording of the workflow |

---

### Key API patterns

**Write a scalar float to every vertex:**
```python
attr = me.attributes.new("altitude", 'FLOAT', 'POINT')
attr.data.foreach_set("value", my_float_array)   # len == vertex_count
```

**Write a colour per face (flat RGBA buffer):**
```python
colours = array.array('f', [r0,g0,b0,a0, r1,g1,b1,a1, ...])
attr = me.attributes.new("face_colour", 'FLOAT_COLOR', 'FACE')
attr.data.foreach_set("color", colours)           # len == face_count × 4
```

**Aggregate vertex data to face domain:**
```python
lv = array.array('i', [0] * len(me.loops))
ls = array.array('i', [0] * len(me.polygons))
lt = array.array('i', [0] * len(me.polygons))
me.loops.foreach_get("vertex_index", lv)
me.polygons.foreach_get("loop_start", ls)
me.polygons.foreach_get("loop_total", lt)
for fi in range(len(me.polygons)):
    s, t = ls[fi], lt[fi]
    face_val = sum(vert_vals[lv[s+k]] for k in range(t)) / t
```

**Read back for validation:**
```python
buf = array.array('f', [0.0] * len(me.vertices))
me.attributes["altitude"].data.foreach_get("value", buf)
```

---

### Blender 5.1 notes

- `export_attributes=True` in `bpy.ops.export_scene.gltf()` serialises
  supported custom types as GLTF accessor channels.
- `FLOAT_COLOR` on `FACE` domain exports as `COLOR_0` when marked active via
  `me.color_attributes.active_color_index`.
- Write UV data to `'CORNER'` domain with type `'FLOAT2'`, not `'POINT'` —
  UVs live at face corners, not at vertices, because a vertex shared by two
  faces can have two different UV positions.

---

### Tutorial
[/tutorials/blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline](https://holoflow.co.uk/tutorials/blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline)
