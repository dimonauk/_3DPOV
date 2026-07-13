# bmesh.ops — Limited Dissolve + Poke
## Dense → Faceted Sphere Ornament | Blender 5.1

**Topic:** Topology reduction and centroid-fan subdivision using `bmesh.ops.limited_dissolve`, `bmesh.ops.dissolve_edges`, and `bmesh.ops.poke`.  
**Studio use case:** Generating faceted ornament GLBs for WebXR instancing without any manual topology work.

---

### What this produces

| Artefact | Notes |
|---|---|
| `ornament_faceted.blend` | Animated .blend with materials, camera rig |
| `/tmp/<slug>.glb` | Draco L6 + WebP, ~4 KB compressed |
| `public/library/videos/.../viewport.mp4` | 4-second viewport render via `record.py` |
| `public/library/videos/.../screen.mp4` | OBS screen recording per `SCREEN-RECORDING-NOTES.md` |

---

### Three bmesh.ops covered

#### `bmesh.ops.limited_dissolve`
Angle-threshold batch dissolution. Collapses every edge whose dihedral angle is below `angle_limit`. The key parameter is `delimit`: an empty set dissolves across all barriers; `{'MATERIAL','SHARP'}` preserves material splits and hard-edge marks.

#### `bmesh.ops.dissolve_edges`
Surgical per-edge dissolution. Takes an explicit edge list and removes each edge, merging its two adjacent faces into one N-gon. `use_verts=True` also cleans up collinear "wire" vertices left behind.

#### `bmesh.ops.poke`
Face centroid-fan split. Inserts one vertex at the face centre and draws N edges to the N corner vertices, replacing one face with N triangles. `center_mode='MEAN_WEIGHTED'` weights the centre by triangle area — more stable than unweighted mean for irregular N-gons.

---

### Pipeline at a glance

```
create_icosphere (subdivisions=2, 80 tris)
        ↓
limited_dissolve (angle < 30°)   →  ~24 large N-gons
        ↓
dissolve_edges (angle < 8°)      →  micro-artefact cleanup
        ↓
poke (top-4 faces by vert count) →  starburst fans (material index 1)
        ↓
recalc_face_normals + flat shade
        ↓
triangulate (BEAUTY / EAR_CLIP)
        ↓
export GLB (Draco L6, Y-up, WebP)
```

---

### Run instructions

```bash
# Build the mesh and export GLB
blender --background --python blueprint.py

# Add camera, lights, and render viewport.mp4
blender ornament_faceted.blend --background --python record.py
```

---

### Troubleshooting

**`bm.faces.ensure_lookup_table()` missing → IndexError**  
Add after any `limited_dissolve` or `dissolve_edges` call. Blender rebuilds the C index pool lazily; this forces it.

**`limited_dissolve` removes nothing**  
Check `LD_ANGLE_DEG`. Values below ~5° have no effect on a smooth icosphere at S=2. Try 20–35° for visible faceting.

**Poke fans point inward after recalc**  
`POKE_OFFSET > 0` raises the fan centre outward; if the mesh has inward-wound faces before recalc, the raised tip flips. Call `recalc_face_normals` AFTER poke, not before.

**GLB export fails with `RuntimeError: Operator bpy.ops.export_scene.gltf.poll() failed`**  
Ensure the `io_scene_gltf2` add-on is enabled. In Blender 5.1 it ships as a bundled extension enabled by default.
