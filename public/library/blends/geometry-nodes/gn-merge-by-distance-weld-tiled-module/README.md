# GN Merge by Distance — Weld-Clean Tiled Module Assembly
**Blender 5.1 · Geometry Nodes · CC0**

Demonstrates `GeometryNodeMergeByDistance` as the essential topology-unification
step after `RealizeInstances`.  A 3 × 3 grid of dressed-stone floor tiles is
assembled via `InstanceOnPoints`, then realised and welded into a single
manifold, watertight mesh suitable for 3D-print submission and boolean operations.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — builds module mesh, GN tree, material, camera, light; exports `.blend` + `.glb` |
| `record.py` | Headless animation render — animates the weld threshold 0→WELD_DIST over 120 frames for the viewport turntable clip |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the manual tutorial screen recording |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Expected outputs

```
tile_wall_welded.blend       — Blender scene with GN_WeldTile modifier
tile_wall_welded.glb         — Draco-compressed GLB of the welded 3×3 tile surface
```

## Running

```bash
# Generate .blend and .glb
blender --background --python blueprint.py

# Render viewport animation (requires GPU or software renderer)
blender --background --python record.py
```

## Key technique

| Node | Role |
|------|------|
| `GeometryNodeMeshGrid` | Regular GRID_COLS × GRID_ROWS vertex grid as scatter positions |
| `GeometryNodeMeshToPoints` | Extract vertex positions as a point cloud |
| `GeometryNodeInstanceOnPoints` | Place tile module at each point |
| `GeometryNodeRealizeInstances` | Convert instances to real geometry (introduces seam duplicates) |
| `GeometryNodeMergeByDistance` | **Hero** — weld seam vertices, produce watertight mesh |

**mode = 'ALL' is required** after `RealizeInstances`.  Adjacent-tile boundary
verts share XYZ but have NO connecting edges, so `CONNECTED` mode leaves them
unmerged.  `ALL` collapses any two verts within `Distance` regardless of topology.

## Weld threshold guidance

| Scale | WELD_DIST | Rationale |
|-------|-----------|-----------|
| Jewellery (mm) | 0.0001 mm | Sub-micron gap; stay above FP epsilon |
| Architecture (m) | 0.0005 m | Half a millimetre; far below smallest feature |
| Environment (km) | 0.01 m | 1 cm; terrain mesh tolerances |

Always verify with **Mesh → Statistics** before/after, and run the **3D Print
Toolbox** (Non-Manifold check) to confirm zero remaining seam edges.

## Licence
CC0 1.0 — no attribution required, but links back to Holoflow Studio appreciated.
