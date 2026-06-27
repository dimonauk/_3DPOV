# GN Shortest Edge Paths — Watershed River Network
**Blender 5.1 · Geometry Nodes · CC0**

Dijkstra's shortest-path algorithm, expressed as the `Shortest Edge Paths` node
in Blender 5.1, routes minimum-cumulative-cost paths across mesh topology. When
vertex elevation is used as Edge Cost, paths naturally flow downhill — producing
a physically plausible river drainage network on any terrain mesh.

## What this entry contains

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script: fractal terrain grid, elevation attributes, GN watershed tree, materials, saves `.blend`, exports `.glb` |
| `record.py` | Viewport animation: orbiting camera, river emission pulse, EEVEE render to PNG sequence |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-capture tutorial video |
| `.expected-artefacts.json` | Manifest of expected output files and key GN nodes |

## Running blueprint.py

Open Blender 5.1 in the Scripting workspace. Open `blueprint.py` and run it.

The script creates:
- `watershed_river.blend` — terrain mesh with GN Watershed modifier, two materials
- `watershed_river.glb` — terrain + river network in one Draco-compressed GLB

After running, enter the 3D Viewport. You should see a rolling terrain grid
with emissive blue river tubes following the valleys.

**If no rivers appear:**
1. Check Viewport Overlay → Statistics — does the evaluated mesh show extra
   geometry beyond the terrain grid? If vertex count matches the raw grid only,
   the GN modifier is not evaluating. Click the wrench icon → confirm the
   modifier is in the stack.
2. Open the Spreadsheet editor, set domain to **Point**, and check for
   `is_valley` and `is_ridge` attributes. If absent, the Python attribute
   assignment step silently failed — re-run blueprint.py.
3. If `is_valley` is all False, raise `VALLEY_THRESHOLD` (e.g. to 0.0).
   The fractal noise may have produced a terrain where no vertices fall below −0.30.

## Running record.py

Run after blueprint.py with `watershed_river.blend` open. Renders 150 frames to:
```
public/library/videos/geometry-nodes/gn-shortest-edge-paths-watershed-river-network/
```
Mux with FFmpeg:
```
ffmpeg -r 30 -i viewport_%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4
```

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `GRID_RESOLUTION` | 40 | Vertices per side. 40 → 1600 verts. Higher = richer tributary net, slower |
| `NOISE_HEIGHT` | 1.8 m | Maximum terrain elevation |
| `VALLEY_THRESHOLD` | −0.30 | Z below this → End Vertex (river mouth). Fewer valleys → longer main rivers |
| `RIDGE_THRESHOLD` | 0.60 | Z above this → Start Vertex (tributary source). Higher → fewer, coarser paths |
| `RIVER_MAX_RADIUS` | 0.035 m | Tube radius at the valley end (downstream widening) |
| `RIVER_MIN_RADIUS` | 0.004 m | Tube radius at the ridge tip (upstream thinning) |

## Licence

All files in this directory: CC0 / public domain.
