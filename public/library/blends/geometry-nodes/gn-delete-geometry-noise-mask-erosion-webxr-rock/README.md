# GN Delete Geometry — Noise-Mask Erosion for WebXR Rock / Asteroid (Blender 5.1)

**Technique**: Drive `Delete Geometry` (domain=`FACE`, mode=`ALL`) with a boolean
mask computed from a 3-D Noise Texture to remove faces from an icosphere, producing
a procedurally eroded rock or asteroid prop ready for WebXR GLB export.

## What this builds

| Artefact | Description |
|---|---|
| `eroded_asteroid.glb` | Draco-compressed (~68 KB), ~280 visible triangles at threshold 0.48 |
| `blueprint.py` | Builds the icosphere base, attaches the GN modifier tree, exports GLB |
| `record.py` | Animates threshold 0→0.72 over 60 frames, renders PNG sequence |
| `viewport.mp4` | Compiled from record.py output (Dimona runs locally) |
| `screen.mp4` | OBS screen capture — see SCREEN-RECORDING-NOTES.md |

## Node tree overview

```
Position ──► Noise Texture (3D, scale=3.2, detail=5)
                │ Fac
             Math (1 − Fac)          ← invert: valley=high, peak=low
                │
             Compare (LESS_THAN, threshold)
                │ Result (bool per face)
             Delete Geometry  domain=FACE  mode=ALL
                │
             Merge by Distance  dist=0.002
                │
             Triangulate Mesh   SHORTEST_DIAGONAL
                │
             Smooth by Angle    30°
                │
             Set Shade Smooth
```

## Key parameters (exposed as GN sockets)

| Socket | Default | Effect |
|---|---|---|
| Erosion Threshold | 0.48 | 0 = no deletion, 1 = delete everything |
| Noise Scale | 3.2 | World-space erosion patch size |
| Noise Detail | 5.0 | Octave count — higher = more fractal edge |
| Seed | 0 | W-dimension offset; changes pattern without retopology |
| Merge Distance | 0.002 | Weld tolerance for orphaned verts after deletion |

## Critical warning: index renumbering

After `Delete Geometry`, face indices are compacted — face 47 in the input
might become face 19 in the output.  Any `Sample Index`, `Field at Index`,
or `Capture Attribute` referencing a face index must sit **before** the node
in the tree, or it will resolve to the wrong face.

## Blender 5.1 compatibility notes

- `tree.interface.new_socket()` replaces the deprecated `tree.inputs.new()`.
- `noise.inputs['W']` (4-D noise W dimension) is used as a seed; set
  `noise.noise_dimensions = '3D'` first so W has no geometric effect.
- `delete_geo.mode = 'ALL'` matches the enum string in 5.1; earlier builds
  used `'GEOMETRY'` — verify with `bpy.types.GeometryNodeDeleteGeometry.bl_rna`.

## Licence

Blueprint and notes: CC0 1.0 Universal (public domain).
