# bmesh Mesh Integrity Pipeline — find_doubles · recalc_face_normals · holes_fill

**Blender 5.1 · CC0 1.0 Universal · Holoflow Studio**

Pure-bmesh import repair pipeline for three endemic mesh defects: seam
duplicate vertices, inverted winding order, and open boundary holes.  No
`bpy.ops` calls, no context override — runs headless from a CLI subprocess
or a Blender Text Editor session alike.

## Studio asset

Faceted teardrop gem pendant crown (`hf_gem_pendant.glb`).  The blueprint
deliberately introduces all three defects, then repairs them in order:

| Step | Operator | Defect repaired |
|------|----------|-----------------|
| 1 | `bmesh.ops.find_doubles` + `weld_verts` | Seam duplicate vertices |
| 2 | `bmesh.ops.recalc_face_normals` | Inverted winding order |
| 3 | `bmesh.ops.holes_fill` | Open table hole |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full production script, Blender 5.1 |
| `record.py` | Viewport animation: broken → repaired comparison |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

```bash
blender --background --python blueprint.py
# Writes hf_gem_pendant.glb relative to the .blend file path
```

## Key operator facts

- `find_doubles` **returns** `{'targetmap': {src: tgt}}` — it does not merge.
  Pass the map to `weld_verts`.  Empty map → no duplicates found.
- Refresh `bm.verts.ensure_lookup_table()` etc. immediately after `weld_verts`;
  element indices are remapped.
- `recalc_face_normals` requires a connected, manifold surface to work
  correctly.  Call it **after** welding the seam.
- `holes_fill` edges argument must be boundary edges only (`e.is_boundary`).
  `sides=0` fills with arbitrarily large polygons; `sides=4` caps with quads
  where possible, triangles otherwise.

## Tutorial

`/tutorials/blender-tutorial-python-bmesh-ops-find-doubles-recalc-normals-holes-fill-mesh-integrity-glb-webxr`
