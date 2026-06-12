# GN Bake Node — Simulation Growth Cache: Crystal-Spread Frozen to Disk

**Blender 5.1 · CC0 · Holoflow Studio**

A flood-fill activation simulation spreads from a north-pole seed vertex across
a UV sphere over 60 frames.  The `GeometryNodeBake` node sits downstream of the
Simulation Zone and captures the full animated geometry to disk, enabling instant
timeline scrubbing without re-evaluating the simulation history.

## What this tutorial covers

| Concept | Detail |
|---|---|
| Simulation Zone | spreading `activated` attribute via `BlurAttribute` |
| Bake node placement | after sim zone, on the main geometry flow |
| Cache path | `//simulation_cache/<modifier>/<bake_id>/` |
| Bake trigger | UI: Properties › Modifier › Bake section |
| Cache invalidation | "Free Bake" button or delete `simulation_cache/` |
| GLB export | single-frame depsgraph snapshot, no bake required |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Build scene + GN tree + material; export frame-22 GLB |
| `record.py` | Render 60-frame viewport animation to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `crystal_spread_growth.blend` | Saved blend (run blueprint.py to generate) |
| `crystal_spread_growth.glb` | Frame-22 snapshot of half-activated sphere |

## How to run

```
1. Open Blender 5.1 → Scripting workspace → Open → blueprint.py → Run Script
2. Switch to Layout workspace → press Space to play animation
3. Properties › Modifier › CrystalSpreadBake › Bake section → click [Bake]
4. Scrub the timeline freely — playback is instant from the cache
5. To record: open record.py → Run Script
```

## Parameters to experiment with

```python
SPREAD_THRESHOLD = 0.15   # raise to 0.35 → slower, organic wavefront
BLUR_ITERATIONS  = 2      # raise → 2 rings/frame, faster fill
SEED_Z_THRESHOLD = 0.0    # set to -0.5 → seed half the sphere immediately
```

## Technical notes

The `activated` attribute is stored as `FLOAT` (not `BOOLEAN`) so the `BlurAttribute`
node can operate on it — Blur does not support BOOLEAN domain.  The `GREATER_THAN`
comparison at `0.15` converts the blurred float back to a binary 0/1 mask each frame.

The Bake node stores one `.bnode` file per frame at
`<blend_dir>/simulation_cache/CrystalSpreadBake/<bake_node_id>/`.  Each file holds
compressed geometry data (positions, normals, named attributes) for that frame.
Total cache size for 60 frames on a 24×16 UV sphere is approximately 2–4 MB.

## Licence

All content in this directory is released under CC0 (public domain).
Outside sources credited in blueprint.py header.
