# Screen Recording Notes — GN Image Texture Heightmap

## Session Goal
Record `blueprint.py` building the heightmap terrain live, then pan the viewport
to show the displacement profile and the elevation colour ramp.

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary required) |
| Format | MP4 · H.264 |
| Output file | `public/library/videos/geometry-nodes/gn-image-texture-heightmap-terrain/screen.mp4` |

## Shot List

1. **Scripting workspace** — open `blueprint.py` in the Text Editor. Scroll slowly
   through the `_build_gn_tree()` function so the viewer reads the node chain:
   Position → SeparateXYZ → Math(DIVIDE) → Math(ADD) → CombineXYZ → Image
   Texture → SeparateXYZ → Math(MULTIPLY) → CombineXYZ → Set Position.

2. **Run the script** — click *Run Script* (Ctrl+Alt+R). The terrain mesh appears
   in the 3D Viewport with elevation colour.

3. **Geometry Nodes editor** — switch to the GN workspace. Show the live node
   graph. Hover over the Image Texture node to display the tooltip (shows
   image name `hs_heightmap`). Hover over Set Position to show its Offset socket.

4. **Viewport shading — Material Preview** — toggle Solid → Material Preview
   (Z, then 2) to show the elevation-coloured terrain.

5. **Inspector — named attribute** — open the Spreadsheet editor. Set Domain to
   Vertex. Find the `height` column (float, 0–1 range). Scroll to show a peak
   vertex near 1.0 and a valley vertex near 0.0.

6. **Modifier panel** — select the terrain object, open Properties → Modifier.
   Show the `ImageHeightmap` GN modifier. There are no exposed sockets (this
   blueprint uses internal parameters), but show the node group dropdown and
   click the GN editor icon to jump back to the tree.

7. **Close-up of the ridge** — orbit the viewport to frame the diagonal ridge
   from Octave 2. Enable Edge Angle overlay (Viewport Overlays → Statistics)
   to show face count: 8 192 triangles (64 × 64 × 2).

## Titles to Overlay in Edit (optional)
- `0:00` → "GN Image Texture Heightmap · Blender 5.1"
- `0:08` → "Synthesising a greyscale heightmap in bpy"
- `0:20` → "GN tree: XY position → UV → Image Texture → Set Position offset"
- `0:38` → "Named attribute 'height' → elevation colour ramp in shader"
- `0:52` → "Result: 4 096 flat-faceted quads displaced from a PNG"

## Approximate Duration
45–60 seconds at comfortable pace. No narration needed — code and node graph
are self-explanatory at 1920 × 1080.
