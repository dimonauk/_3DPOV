# Screen Recording Instructions — Foreach Spline Ribbon

## Target file
`public/library/videos/geometry-nodes/gn-foreach-element-zone-curve-per-spline-accumulation-poi-ribbon-webxr/screen.mp4`

## OBS / Game Bar settings
- **Window source**: Blender 5.1 (full window)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no mic, no desktop audio)
- **Codec**: H.264, CRF 18 (high quality)

## What to capture

1. **Script run** (30 s)
   Open the Scripting workspace.  Paste `blueprint.py` into a new text block.
   Show the constants at the top, scroll slowly.  Click **Run Script** and let
   the console print `[hf_ribbon] Done.` — keep the console in frame.

2. **GN node graph** (45 s)
   Switch to the Geometry Node Editor.  Show the full graph: outer group-input
   → Foreach Zone (highlight the paired input/output nodes) → inside the zone
   (Spline Length, Math, Circle, Curve to Mesh, Set Material Index) → group
   output.  Zoom into the Foreach zone to show the `domain = SPLINE` property.

3. **Viewport preview** (20 s)
   Switch to the 3D Viewport, Rendered shading (EEVEE Next).  Rotate the view
   around the ribbon bundle slowly.  The 8 coloured ribbons should glow with
   bloom against the black background.

4. **Spreadsheet** (15 s)
   Open the Spreadsheet Editor on the Curves object (pre-modifier evaluation).
   Show the Spline domain — confirm 8 rows, one per spline.  Switch to the mesh
   output (post-modifier) — show the face count, material index per face.

5. **GLB in browser** (10 s optional)
   Drag `hf_poi_ribbons.glb` into `gltf.report` or Three.js editor and show
   the 8 coloured strands.  Frame the full bundle from a 45° angle.

## Editing guide
- Cut between segments at natural pauses (script completion, node zoom-in)
- No background music
- Add a title card: "Foreach Element Zone — Per-Spline Curve Ribbons · Blender 5.1 · Holoflow Studio"
- Export as H.264 MP4, 1920 × 1080, 30 fps
