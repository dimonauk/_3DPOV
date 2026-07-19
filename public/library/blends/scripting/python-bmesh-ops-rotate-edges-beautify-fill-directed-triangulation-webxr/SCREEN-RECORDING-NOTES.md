# Screen Recording Notes — rotate_edges + beautify_fill Terrain Demo

## Target file
`public/library/videos/scripting/python-bmesh-ops-rotate-edges-beautify-fill-directed-triangulation-webxr/screen.mp4`

## Software
OBS Studio 30+ or Windows Game Bar (`Win + G`).

## Blender window settings
- Resolution: 1920 × 1080 (Full HD)
- Theme: Dark (default)
- Viewport shading: **Solid** → MatCap or Flat — to show the facet pattern clearly
- Overlay: **Face Orientation** off, **Wireframe** on at ~15 % opacity
- Editor: Scripting workspace — split between Text Editor (blueprint.py) and 3D Viewport

## OBS source settings
- Source type: **Window Capture** → Blender 5.1
- Resolution: 1920 × 1080
- FPS: 30
- Audio: off

## Recording steps
1. Open Blender 5.1, switch to Scripting workspace.
2. Load `blueprint.py` in the Text Editor.
3. **Start recording.**
4. Scroll through blueprint.py, pausing at:
   - `bmesh.ops.triangulate` call (~5 s)
   - `left_edges` / `right_faces` partition loop (~5 s)
   - `bmesh.ops.rotate_edges` call + inline comment (~10 s)
   - `bmesh.ops.beautify_fill` call + inline comment (~10 s)
5. Press **Run Script** (`Alt + P`).
6. Switch to **3D Viewport**, orbit to show the two-region tile.
7. Toggle **Wireframe overlay** (Shift + Z or overlay panel) to reveal the different diagonal patterns in each half.
8. Orbit slowly around the tile showing teal (rotate_edges) vs violet (beautify_fill) regions.
9. **Stop recording.**
10. Trim to ≤ 90 seconds. Export as H.264, CRF 23, 1920 × 1080, 30 fps.

## Key visual moments to capture
- The chevron/herringbone diagonal pattern in the teal left half (all diagonals flipped uniformly by `rotate_edges`).
- The varied, locally optimal diagonal pattern in the violet right half (`beautify_fill` chose each diagonal independently based on local geometry).
- The seam where the two regions meet — both achieve closed geometry, only the diagonal direction differs.

## Naming
Rename the exported file to `screen.mp4` and place it at the path above.
