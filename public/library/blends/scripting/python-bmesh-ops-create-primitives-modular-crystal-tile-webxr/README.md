# bmesh.ops Primitive Forge — create_grid, create_cone, create_icosphere, create_uvsphere, create_circle & create_cube

**Blender 5.1 · Holoflow Studio · CC0**

All six `bmesh.ops.create_*` operators share one calling convention: target BMesh, optional
4×4 placement matrix, and `calc_uvs` flag.  They return `{'verts': list[BMVert]}` — direct
element references usable for downstream transforms without any lookup-table refresh.  Because
they operate on a raw BMesh with no active Object and no context dependency, multiple primitives
can be built in a single BMesh and converted to one mesh in a single `bm.to_mesh()` — no
join operations, no object merges.

Studio prop: a **3 m × 3 m crystal floor tile** with five hexagonal spires on a pentagon ring,
icosphere gem caps nestled at each spire tip, a UV-sphere accent atop the central pedestal cube,
and flat circle-disc bases at each spire foot.

## Size semantics — the Blender 5.1 inconsistency

| Operator | `size`/`depth` means |
|----------|---------------------|
| `create_grid` | **half-span** — verts at ±size (full tile = 2×size) |
| `create_cube` | **edge length** — corners at ±size/2 |
| `create_cone` | `depth` = **full height** — cone spans ±depth/2 on Z |
| `create_icosphere` | `radius` = circumradius (centre to vertex) |
| `create_uvsphere` | `radius` = circumradius |
| `create_circle` | `radius` = circumradius |

To sit a cone base on the tile floor, translate up by `depth/2`:
```python
matrix=Matrix.Translation((px, py, SPIRE_DEPTH / 2.0))
```

## UV layer ordering

The UV layer **must** be created before any `create_*` call with `calc_uvs=True`:
```python
bm = bmesh.new()
bm.loops.layers.uv.new("UVMap")   # ← before first create_* call
bmesh.ops.create_grid(bm, ..., calc_uvs=True)
```
If you add the UV layer after, the existing faces have no loop UV data and the
layer will be empty on every face.

## Operator signatures (Blender 5.1)

```python
# Returns {'verts': list[BMVert]}
bmesh.ops.create_grid(bm, x_segments, y_segments, size, matrix, calc_uvs)
bmesh.ops.create_cube(bm, size, matrix, calc_uvs)
bmesh.ops.create_uvsphere(bm, u_segments, v_segments, radius, matrix, calc_uvs)
bmesh.ops.create_icosphere(bm, subdivisions, radius, matrix, calc_uvs)
bmesh.ops.create_cone(bm, segments, radius1, radius2, depth,
                      cap_ends, cap_tris, matrix, calc_uvs)
bmesh.ops.create_circle(bm, segments, radius, cap_ends, cap_tris, matrix, calc_uvs)
```

## cap_ends / cap_tris

`cap_ends=True` adds a polygon at each open end (top and bottom of a cone, both
ends of a circle).  `cap_tris=False` makes the cap a single n-gon; `cap_tris=True`
triangulates it with a centre vertex (fan).  For flat-shaded faceted props use
`cap_tris=False` — the n-gon reads as one distinct flat face.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless build + GLB export |
| `record.py` | EEVEE 360° turntable → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS window-capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
blender --background --python blueprint.py
```

Outputs `hf_crystal_tile.glb` next to the script — Draco-compressed, WebP-textured,
+Y-up, WebXR-ready.

## Outside sources

- Blender Foundation — [bmesh.ops API Reference](https://docs.blender.org/api/5.1/bmesh.ops.html) — CC-BY-SA-4.0
- KhronosGroup — [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) — Apache-2.0
