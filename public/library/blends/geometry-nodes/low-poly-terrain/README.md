# Geometry Nodes — Low-Poly Faceted Terrain
`public/library/blends/geometry-nodes/low-poly-terrain/`

Blender 5.1 procedural terrain using Geometry Nodes, flat shading, and
noise displacement. Produces the studio's signature faceted aesthetic
without UVs, baked normals, or sculpting.

## What blueprint.py produces

| Output | Location |
|---|---|
| `terrain_faceted.glb` | this folder (Draco level 6, Y-up, transforms applied) |
| `terrain_faceted.blend` | save manually after running the script |

The GLB is ready to drop into the WebXR Game Framework via `useGLTF()`.

## Prerequisites

- **Blender 5.1** — only core features; no commercial add-ons required.
- `glTF 2.0 I/O` extension — enabled by default in every 5.x install.

## Run

1. Open Blender → **Scripting** workspace.
2. Open `blueprint.py` in the Text Editor.
3. Click **Run Script** (or `Alt + P`).
4. **File → Save As** → `terrain_faceted.blend` in this folder.
5. The GLB is written to this folder at `//terrain_faceted.glb`.

## Record the viewport video

After `blueprint.py` has run (terrain_faceted must exist in the scene):

1. Open `record.py` in the Text Editor.
2. Run it — Blender animates + renders to:
   `public/library/videos/geometry-nodes/low-poly-terrain/viewport.mp4`
3. For the screen recording, follow `SCREEN-RECORDING-NOTES.md`.

## Tuning

All parameters are named constants at the top of `blueprint.py`:

| Constant | Default | Effect |
|---|---|---|
| `GRID_SIZE` | 10.0 m | Physical size of the terrain patch |
| `GRID_VERTS` | 48 | Verts per side — 48² → 4 608 triangles |
| `NOISE_SCALE` | 3.2 | Spatial frequency; 2–5 works at 10 m patch |
| `NOISE_DETAIL` | 4.0 | Fractal octave count |
| `NOISE_ROUGHNESS` | 0.65 | Hurst exponent approximation |
| `DISPLACEMENT_MAX` | 1.6 m | Peak height above the grid plane |
| `SEED` | 42 | Change for a different terrain, same frequency |

## Holoflow exporter flags

`holoflow:facet = True` is set on the object. The studio's WebXR exporter
reads this flag and skips the smooth-normal bake — the exported GLB carries
raw face normals, which is exactly what flat shading requires.

## Licence

Blueprint: CC0 (public domain). Terrain output GLB: CC0.
Attribution appreciated but not required.
