# bmesh.ops.rotate_edges + bmesh.ops.beautify_fill
## Directed-Diagonal Triangulation & Delaunay Refinement — Faceted Terrain Tile

**Blender 5.1 · Python API · CC0**

Demonstrates two complementary triangle-edge operations on an existing triangulation:

| Operator | Effect | When to use |
|---|---|---|
| `rotate_edges` | Flips the diagonal of each targeted tri-pair to its alternative | Artistic control — uniform chevron, directed flow, deliberate pattern |
| `beautify_fill` | Swaps edges to minimise area or angle variance per tri-pair | Quality pass — reduce slivers, improve normal baking, Delaunay-like |

Neither operator adds or removes vertices — they only redirect which vertices an interior edge connects.

## Showcase

An 8 × 8 quad grid with seeded Z-noise is triangulated with a uniform `FIXED` diagonal. It is then split at the world X midpoint:

- **Left half (teal)** — `rotate_edges` flips every interior diagonal once, producing a chevron / herringbone pattern.
- **Right half (violet)** — `beautify_fill` optimises each diagonal independently for equal-area triangles.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full headless Blender script; produces `hf_terrain_tile.glb` |
| `record.py` | Viewport-animation render; produces `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```
blender --background --python blueprint.py
```

GLB exported to working directory as `hf_terrain_tile.glb`.

## Licence

Blueprint, record script, and notes: CC0 1.0 Universal.
