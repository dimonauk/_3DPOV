# bmesh.ops.poke — Face-Poke & Raised Boss Lattice: Faceted Crystal Shield

**Blender 5.1 · Holoflow Studio · CC0**

`bmesh.ops.poke` inserts a centre vertex into every selected `BMFace` and creates
a triangle fan. Setting `offset > 0` raises that vertex along the face normal,
producing a diamond boss. Every quad in a grid becomes a 4-triangle X-crown;
every hexagon becomes a 6-triangle pinwheel. Combined with sharp-edge tagging
on the new spoke edges the result is a hard-faceted crystal surface that exports
clean split normals into the GLB NORMAL accessor.

## Artefacts

| File | Description |
|---|---|
| `blueprint.py` | Headless bpy + bmesh — run in Blender's Script Editor |
| `hf_poke_shield.blend` | Saved after blueprint.py run |
| `hf_poke_shield.glb` | Draco L6 · +Y up · WebP textures |
| `record.py` | Cycles 64spp turntable render → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

Expected vertex / face counts (GRID_SEGS=7, DISC_RADIUS=0.88):
- Disc faces after trim: ~33 quads
- After poke: ~132 triangles (4× each quad) + rim wall + back cap
- Total: ~170–190 faces, ~110–130 vertices

## § 1 — poke signature

```python
result = bmesh.ops.poke(
    bm,
    faces               = list_of_BMFace,  # required
    offset              = 0.0,             # displacement along face normal
    use_relative_offset = False,           # if True, offset *= face area
    center_mode         = 'MEAN_WEIGHTED', # see §3
)
centre_verts = result['verts']  # list[BMVert] — one per input face
```

## § 2 — return value invariant

`result['verts']` contains exactly **one new BMVert per input face** — the raised tip.
These handles are **valid immediately** after the call (unlike some BMesh ops that
invalidate the input list). Use the set for material assignment and further manipulation.

Old BMFace handles passed in `faces=` are **not** invalidated — they are split into
child triangles that still exist, but their geometry changes. Take a fresh snapshot
via `bm.faces.ensure_lookup_table()` after poke if you need to re-index.

## § 3 — centre_mode options

| Mode | Behaviour | Use when |
|---|---|---|
| `MEAN_WEIGHTED` | Area-weighted centroid — biased toward larger sub-triangles | Default; most stable for non-square quads and n-gons |
| `MEAN` | Equal-weight mean of all vertex positions | Square quads; identical to MEAN_WEIGHTED for regular polygons |
| `BOUNDS` | Midpoint of face bounding box | Symmetric placement on axis-aligned quads; unusual on angled faces |

## § 4 — sharp edges and the facet look

Poke creates new spoke edges (centre → each rim vertex). These default to
**smooth** after the call. To get the hard-facet crystal look, mark all edges:

```python
for e in bm.edges:
    e.smooth = False   # writes the "sharp_edge" boolean mesh attribute in Blender 5.1
for f in bm.faces:
    f.smooth = False   # flat shading per face
```

In the GLB the exporter writes split per-corner normals at every sharp edge,
so every facet triangle appears as a discrete flat plane in the Three.js / Babylon
fragment shader — no WeightedNormal modifier needed.

## § 5 — combining with inset_faces

For the classic armoured boss look (groove ring around each raised diamond):
1. `bmesh.ops.inset_faces(bm, faces=disc_faces, use_individual=True, thickness=0.03)`
   → returns inner faces (`result['faces']`)
2. `bmesh.ops.poke(bm, faces=result['faces'], offset=BOSS_HEIGHT)`
   → raises only the inner face; outer groove ring stays flat

This stacks cleanly because inset preserves quads while poke only operates on
the face list you pass — neither op touches geometry it was not given.

## § 6 — failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Boss tip at same Z as surrounding face | offset=0 (default) — poke ran but with no displacement | Set BOSS_HEIGHT > 0 |
| Inverted normals on back plate | extrude_edge_only + fill can flip winding | Call recalc_face_normals after fill |
| `result['verts']` shorter than input face list | Degenerate zero-area face in input | Pre-filter: skip faces where calc_area() < 1e-6 |
| Poke on triangles produces 3-triangle sub-fan | Correct — triangle fan on a triangle is 3 children | Expected; boss_verts set still valid |
| Dangling verts after disc trim | FACES context leaves verts with no link_faces | Follow with delete(context='VERTS') on [v for v if not v.link_faces] |

## Outside sources

- **Blender Foundation** — [bmesh.ops API Reference 5.1](https://docs.blender.org/api/5.1/bmesh.ops.html)
  · CC-BY-SA-4.0 · related: [Blender source](https://projects.blender.org/blender/blender)
- **Khronos Group** — [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO)
  · Apache-2.0 · related: [glTF spec](https://github.com/KhronosGroup/glTF)
