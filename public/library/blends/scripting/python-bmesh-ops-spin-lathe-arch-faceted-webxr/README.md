# python-bmesh-ops-spin-lathe-arch-faceted-webxr

Blender 5.1 blueprint demonstrating `bmesh.ops.spin` — the low-level rotational-extrude primitive that underlies the Screw modifier.

Produces two props in a single headless Python session:

| Prop | File | Geometry | Technique |
|------|------|----------|-----------|
| Hex-faceted toroid ring | `hf_spin_toroid.glb` | 126 verts · 108 quads | Full 360° revolution, `use_merge=True` |
| Horseshoe arch gateway | `hf_spin_arch.glb` | 60 verts · 50 quads + 2 caps | 240° partial sweep, `use_merge=False` + manual caps |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless Blender script — run with `blender --background --python blueprint.py` |
| `record.py` | Camera-orbit viewport animation — run after blueprint.py in the same session |
| `hf_spin_toroid.glb` | Gold/copper toroid, Draco L6, WebXR-ready |
| `hf_spin_arch.glb` | Stone horseshoe arch, Draco L6, WebXR-ready |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen capture |

## Quick Run

```bash
blender --background --python blueprint.py
# → writes hf_spin_toroid.glb + hf_spin_arch.glb next to the script

blender hf_spin_toroid.blend --python record.py
# → writes viewport.mp4 to public/library/videos/scripting/…
```

## Key API Notes

`bmesh.ops.spin` requires the `geom` list to contain **both BMVert and BMEdge objects**.
Passing vertices alone produces an isolated vertex fan — no bridge quads are created.

```python
# WRONG — no edges → no faces
bmesh.ops.spin(bm, geom=verts_only, …)

# CORRECT — edges trigger quad bridging between revolution steps
bmesh.ops.spin(bm, geom=verts + edges, …)
```

For a **full revolution** (360°): set `use_merge=True` and `merge_dist < shortest_edge_length`
to weld the final step back to step 0 and eliminate the seam lighting artefact.

For a **partial revolution**: set `use_merge=False`, then manually cap the open boundary
loops using `bm.faces.new()`. The convenience handle `result['geom_last']` gives the
end-cap verts without requiring index arithmetic.

## Licence
CC0 — public domain. No attribution required.
