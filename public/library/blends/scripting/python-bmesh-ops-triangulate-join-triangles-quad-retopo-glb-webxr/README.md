# bmesh.ops.triangulate + bmesh.ops.join_triangles
### Export-Safe Triangulation & Selective Quad Restoration · Blender 5.1

**Studio slug:** `python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr`
**Licence:** CC-0 · Holoflow Studio

---

## What this teaches

`bmesh.ops.triangulate` converts any face topology — quads, tris, n-gons —
into an all-triangle mesh.  `bmesh.ops.join_triangles` is the selective inverse:
it dissolves adjacent coplanar triangle pairs back into quads.

Together they form the **triangulate → inspect → selective-rejoin** pipeline used
in every production GLB / game-engine export workflow.

---

## Why triangulate in Python at all?

The glTF 2.0 spec permits only triangles in mesh primitives.  Blender's GLB
exporter auto-triangulates on the fly, invisibly, using BEAUTY by default.
That works fine until:

- A UV seam runs across a quad and the auto-triangulation picks the wrong
  diagonal, introducing a visible UV distortion.
- An animated mesh has driven blend-shape targets that depend on a specific
  vertex-index layout — auto-triangulation changes the index layout.
- You need to audit face count or winding before submission to a renderer.

Pre-triangulating in Python lets you choose the diagonal method, inspect the
result in the viewport, and lock it before export.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full headless build: raw topology → triangulate → join_triangles → GLB |
| `record.py` | Viewport animation: three phases with orbit camera, renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the companion `screen.mp4` |

---

## Prop: Hexagonal Buckler Shield

- Outer hex ring (6 verts) + inner hex ring (6 verts)
- 6 radial quads connecting outer ↔ inner
- 1 central 6-gon n-gon boss face
- Extruded downward by 5 cm to form a slab

**Post-triangulate** the mesh is 100% triangles.
**Post-join_triangles** the top and bottom slab faces are restored to quads;
the side band remains triangles (normals outside the ±0.85 Z threshold).

---

## Key parameters

```python
# STEP B — triangulate
bmesh.ops.triangulate(
    bm,
    faces       = list(bm.faces),
    quad_method = 'BEAUTY',       # BEAUTY | FIXED | FIXED_ALTERNATE | SHORTEST_DIAGONAL
    ngon_method = 'BEAUTY',       # BEAUTY | CLIP
)

# STEP C — join_triangles (selective)
bmesh.ops.join_triangles(
    bm,
    faces                 = horiz_tris,  # only horizontal faces
    angle_face_threshold  = 0.020,       # ~1.1° dihedral tolerance
    angle_shape_threshold = 0.25,        # quad-shape quality gate
    cmp_sharp             = True,        # respect sharp edge marks
    cmp_materials         = True,        # no join across material slots
)
```

---

## Artefacts

- `hf_shield_disc.blend` — post-join mesh, ready for WebXR preview
- `hf_shield_disc.glb` — Draco L6 · WebP · +Y up
- `viewport.mp4` — 120-frame orbit showing all three topology phases
- `screen.mp4` — OBS capture of the script running step-by-step

---

## Outside sources

- **bmesh.ops API Reference — Blender 5.1**
  Blender Foundation · CC-BY-SA-4.0
  https://docs.blender.org/api/5.1/bmesh.ops.html
  Related: https://projects.blender.org/blender/blender

- **glTF 2.0 Specification — Mesh Primitives**
  Khronos Group · CC-BY-4.0
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes
  Related: https://github.com/KhronosGroup/glTF-Blender-IO

---

## Tutorial page

`/tutorials/blender-tutorial-python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr`
