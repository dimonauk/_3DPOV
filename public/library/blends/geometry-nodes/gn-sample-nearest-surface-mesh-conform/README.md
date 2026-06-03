# GN Sample Nearest Surface — Mesh-Conform Tile Armour

**Blender 5.1 · Geometry Nodes · CC0**

Sample Nearest Surface crosses the object boundary: it takes a target Mesh socket and a query position, then returns any field value sampled at the nearest surface point.  This entry uses it to snap a cloud of hexagonal tiles onto a sphere, align each tile to the local surface normal, and colour them by a latitude attribute baked onto the target.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene builder — creates `tile_armour.blend` |
| `record.py` | EEVEE animation: tiles tighten as Tile Scale grows, camera orbits |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest with cross-reference registry |

## Artefacts produced

- `tile_armour.blend` — Blender file with `ConformTarget` sphere + `TileArmour` GN object
- `tile_armour.glb` — exported via Holoflow exporter (apply modifiers, Draco 6, WebP textures)
- `../../videos/geometry-nodes/gn-sample-nearest-surface-mesh-conform/viewport.mp4` — rendered by `record.py`
- `../../videos/geometry-nodes/gn-sample-nearest-surface-mesh-conform/screen.mp4` — manual OBS capture

## Running the blueprint

```bash
blender --background --python blueprint.py
```

Then open `tile_armour.blend` in Blender 5.1 and run `record.py` from the Text Editor to render the viewport animation.

## Key concepts

- **Two-context evaluation**: the `Value` field on an SNS node evaluates *on the target mesh*, while `Sample Position` evaluates *on the current geometry*.  One `InputPosition` node connected to `Sample Position` reads scatter-point positions; another `InputPosition` connected to `Value` reads target-mesh vertex positions.
- **Three SNS passes**: position snap, normal retrieval, latitude float — all share the same scatter-point query positions.
- **Point-before-instance**: rotation alignment is computed as a field on scatter points, fed to Instance On Points — no Realize Instances needed.
- **Attribute propagation**: `tile_lat` stored on scatter points propagates to all vertices of each instanced tile, giving per-tile colour with zero per-vertex overhead.

## Studio context

Pairs with:
- [`/tutorials/blender-tutorial-gn-geometry-proximity-deform`](/tutorials/blender-tutorial-gn-geometry-proximity-deform) — SNS vs Geometry Proximity: complementary pair
- [`/tutorials/blender-tutorial-gn-capture-attribute-named-attribute`](/tutorials/blender-tutorial-gn-capture-attribute-named-attribute) — attribute storage patterns
- [`/tutorials/blender-tutorial-gn-instance-on-points`](/tutorials/blender-tutorial-gn-instance-on-points) — base instancing technique

## Licence

Blueprint, record script, and documentation: **CC0** (public domain).  
Outside references credited in `.expected-artefacts.json`.
