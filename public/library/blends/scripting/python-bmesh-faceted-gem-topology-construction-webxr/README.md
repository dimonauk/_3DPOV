# Python bmesh — Faceted Gem: Direct Topology Construction (Blender 5.1)

**Blender 5.1 | Scripting | CC0 1.0**

Constructs an octagonal brilliant-cut gemstone entirely through the `bmesh`
direct-data API — no `bpy.ops`, no Edit Mode, no modifier stack.  The script
lays down table, girdle, and culet vertex rings, stitches crown trapezoids and
pavilion triangles, flood-recalculates outward normals with
`bmesh.ops.recalc_face_normals`, assigns cylindrical per-loop UVs through
`bm.loops.layers.uv`, and marks every edge sharp before exporting a
WebXR-ready GLB.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full construction script — run once in the Blender Text Editor |
| `record.py` | EEVEE viewport render: 72-frame spin with three-point lighting |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture instructions for `screen.mp4` |
| `faceted_gem.glb` | Generated export (WebXR-ready, Draco L6, WebP textures) |

## Usage

1. Open Blender 5.1. `File > New > General`.
2. Save the `.blend` to a local folder — `//` paths resolve relative to it.
3. Open the Text Editor (`Shift+F11`), paste `blueprint.py`, press `Alt+P`.
4. Console output: `[bmesh gem] 17V  24E  17F → //faceted_gem.glb`.
5. Run `record.py` in the same session to render `viewport.mp4`.

## Key concepts

- **bmesh lifecycle**: `bmesh.new()` → mutate → `bm.to_mesh(me)` → `bm.free()`
- **`ensure_lookup_table()`**: required after structural changes before integer indexing
- **`recalc_face_normals`**: flood-fill outward — eliminates manual winding care
- **Loop-based UVs**: `bm.loops.layers.uv` — per-loop, not per-vert, enabling UV seams
- **Sharp edges in 5.1**: `mesh.edges[i].use_edge_sharp = True` writes to `sharp_edge` attribute

## Geometry spec

| Parameter | Value |
|-----------|-------|
| Sides (N) | 8 (octagonal) |
| Table radius | 0.35 |
| Girdle radius | 0.60 |
| Crown height | 0.28 |
| Pavilion depth | 0.38 |
| Total faces | 17 (1 table + 8 crown + 8 pavilion) |

## Licence

Blueprint and record scripts: **CC0 1.0 Universal** — public domain dedication.
Use, modify, and redistribute without restriction.
