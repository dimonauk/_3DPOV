# Screen Recording Notes — GN Index-Driven Per-Face Colour

## Software

OBS Studio (Windows/Linux) or Xbox Game Bar (Win+G on Windows).

## Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone) |
| Output format | MP4 / H.264 |
| Output file | `public/library/videos/geometry-nodes/gn-index-face-colour-mosaic/screen.mp4` |

## What to capture (in order)

1. **Scene overview** — 3D Viewport showing the 16×16 rainbow mosaic grid from
   the default top-oblique camera angle. Pan slowly so every tile colour is
   visible. (~15 s)

2. **GN editor** — open the Geometry Nodes editor. Expand the MosaicTileGN
   tree. Show the field branch: InputIndex → Math(MOD) → Math(DIV) →
   CombineColor. Then pan to the geometry pipe: SetShadeSmooth →
   StoreNamedAttribute. (~20 s)

3. **Spreadsheet** — switch to the Spreadsheet editor with domain set to FACE.
   Scroll through the tile_colour column — each row has a different RGBA value
   with hard repeating rainbow pattern. (~10 s)

4. **Material** — open Shader Editor on the mosaic_tile material. Show
   ShaderNodeAttribute → ShaderNodeEmission → Output. Highlight the
   attribute_name = 'tile_colour' field. (~10 s)

5. **HUE_REPEAT variation** — in the GN Math(MODULO) node, change the Value
   input from 16 to 4. The mosaic collapses to a 4-colour stripe. Change back
   to 16. (~10 s)

## Tips

- Use the Blender workspace layout with four quadrants: 3D Viewport (large,
  top-left), GN editor (top-right), Spreadsheet (bottom-left), Shader Editor
  (bottom-right).
- Pause briefly on the Spreadsheet tile_colour column — this is the "reveal"
  moment that shows FACE domain in action.
- No audio needed. Viewers will follow from the on-screen labels.
