# GN Subdivide Mesh — Adaptive Terrain LOD via Noise Field
**Blender 5.1 | Category: geometry-nodes | Licence: CC0**

## What this is
A procedural terrain with noise-driven selective subdivision. Faces where a
Perlin density field exceeds a threshold are split into a dense 4×-subdivided
patch; the remaining faces stay at the coarse base grid. The result looks like
photogrammetric LOD falloff but is entirely node-graph-driven.

## Key insight
`GeometryNodeSubdivideMesh` has no selection input — it subdivides every face.
Selective subdivision requires splitting geometry BEFORE the Subdivide node using
`Separate Geometry`, then joining the two halves after.

## Files
| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy + GN tree; exports `adaptive_terrain.glb` |
| `record.py` | Animates threshold 0.2→0.8→0.2; renders viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Expected artefacts
See `.expected-artefacts.json`

## Running
1. Open Blender 5.1, Scripting workspace.
2. Open and run `blueprint.py` → terrain mesh appears, GLB exported.
3. Open and run `record.py` → viewport.mp4 rendered (requires ffmpeg on PATH).
4. Follow `SCREEN-RECORDING-NOTES.md` for screen.mp4.

## Cross-references
- Tutorial: `/tutorials/blender-tutorial-gn-subdivide-mesh-adaptive-noise-lod`
- Related: GN Smooth by Angle (normal handling after subdivision)
- Related: GN Triangulate Mesh (WebXR tri-safe prep)
- Related: GN Set Position Noise Displacement (height displacement technique)
