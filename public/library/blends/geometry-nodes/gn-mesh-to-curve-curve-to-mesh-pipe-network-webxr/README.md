# GN Mesh to Curve → Curve to Mesh — Angle-Gated Edge Conduit Network

**Blender 5.1 · Geometry Nodes · CC0**

Procedural conduit / cable network for a WebXR interior panel prop.
`GeometryNodeMeshToCurve` converts angle-selected edges of a grid mesh into
spline segments; `GeometryNodeCurveToMesh` sweeps a circular profile along
each segment to produce tube geometry. Junction caps are sealed via
`GeometryNodeMergeByDistance`. The result exports as a clean GLB.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene build + GLB export |
| `record.py` | Viewport animation: tubes grow in over 3 s |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar screen recording guide |
| `output/pipe_network_panel.glb` | Generated on first blueprint.py run |

## Quick start

```bash
blender --background --python blueprint.py
```

## Parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `GRID_X / GRID_Y` | 6 / 4 | Structural panel bay count |
| `ANGLE_THRESHOLD` | 20° | Minimum dihedral angle to become a conduit |
| `TUBE_RADIUS` | 0.014 m | Conduit outer radius |
| `TUBE_PROFILE_VERTS` | 8 | Cross-section polygon count |
| `MERGE_DIST` | 10% of radius | Junction cap weld threshold |

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr`
- Related: GN Bevel Mesh (edge angle concept), GN Merge by Distance (weld mechanics)
- Export target: `public/library/glbs/geometry-nodes/gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr/`

## Licence

Blueprint and recording scripts are CC0. Blender is GPL-2.0.
