# GN Mesh Island — Per-Island Colour, Random Offset, and Separation

**Blender 5.1 | CC0 | Holoflow Studio**

## What this does

Builds a 4 × 4 grid of disconnected quad tiles (16 islands) and applies a
Geometry Nodes modifier that:

1. Reads `IslandIndex` per face — constant within a connected component.
2. Seeds `RandomValue(FLOAT_VECTOR)` with `IslandIndex` → unique colour per tile.
3. Seeds a second `RandomValue(FLOAT)` → unique Z lift per tile, scaled by an
   animatable **Lift Multiplier** group socket.
4. Stores `island_colour` (FLOAT_COLOR, FACE) and `island_index` (INT, FACE) as
   named attributes — the latter enabling downstream `SeparateGeometry` selection
   by integer index.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless bpy script — builds scene, GN tree, material, exports GLB + .blend |
| `record.py` | Keyframes Lift Multiplier 0→1→0, renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output file list |

## Key nodes

- **Geometry > Input > Mesh > Mesh Island** — Island Index (INT) + Island Count (INT).
  The Index adapts to the active domain context; no CaptureAttribute wrapper needed.
- **Utilities > Random Value** (`data_type='FLOAT_VECTOR'`) — ID socket wired to
  Island Index gives identical output for all elements in the same island.
- **Geometry > Write > Store Named Attribute** — `data_type='FLOAT_COLOR'` writes
  `island_colour` at FACE domain; `data_type='INT'` writes `island_index` at FACE domain.
- **Geometry > Geometry > Set Position** — Offset socket receives the random Z lift.
- **Geometry > Selection > Separate Geometry** — combined with a NamedAttribute +
  Compare equality test, isolates any single island by integer index.

## Why IslandIndex at FACE domain requires no CaptureAttribute

`GeometryNodeInputMeshIsland` is a *field source* — it declares HOW to compute a
value, not what the value currently is.  When `StoreNamedAttribute(domain='FACE')`
pulls from this field, Blender evaluates it once per face at the face domain.  Because
every face in a connected component shares the same topology-derived island index, the
field naturally yields a constant per face within each island.  The same logic applies
to POINT domain: all vertices of a tile share the same island.

If you were to chain topology-modifying nodes (Subdivide, Triangulate, Extrude) *before*
the StoreNamedAttribute, the island indices remain stable as long as connectivity does
not change.  Extrude Mesh that creates new faces from existing ones assigns those new
faces the island index of their source faces automatically.

## Extending the pattern

### Exploded view

Add a `NamedAttribute(name="island_index")` + `Compare(INT, EQUAL, B=N)` +
`SeparateGeometry(domain='FACE')` subtree after `n_store_idx`.  Expose N as a group
input to animate island separation interactively.

### Per-island scale or rotation

Use the same `ID=IslandIndex` → `RandomValue(FLOAT_VECTOR)` pattern for per-island
instance rotation before `InstanceOnPoints`.  The seed difference ensures the colour
and the rotation are uncorrelated.

### Fragment / destruction preview

Combine with **Voronoi Fracture** (Edit Mode, bisect planes) to shatter a mesh into
irregular islands, then use this pipeline to colour and offset each shard
independently.

## Outside sources

- Blender Manual — Mesh Island Node.
  URL: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/mesh_island.html
  Licence: CC-BY-SA 4.0 · Author: Blender Documentation Team
- glTF-Blender-IO exporter.
  URL: https://github.com/KhronosGroup/glTF-Blender-IO
  Licence: Apache-2.0 · Author: Khronos Group
