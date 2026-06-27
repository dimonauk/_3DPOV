# Screen-Recording Notes — Watershed River Network
**For OBS Studio / Windows Game Bar · 1920×1080 · 30 fps · audio off**

## OBS Settings

- **Video Capture Device:** Blender application window (Window Capture, not Display Capture)
- **Base Resolution:** 1920×1080
- **Output Resolution:** 1920×1080
- **FPS:** 30
- **Audio:** all tracks disabled
- **File:** `screen.mp4`, H.264, CRF 18

## Suggested recording workflow

1. Run `blueprint.py` so `watershed_river.blend` is open and the modifier is applied.
2. Set shading to **Material Preview** (Z → Material Preview) — this shows the blue
   emissive river channels clearly against the dark terrain.
3. Enable **Viewport Overlays → Statistics** (top-right of the 3D Viewport) so viewers
   can see the vertex count tick upward when you scrub into the GN-evaluated frame.
4. Frame the terrain to fill most of the viewport. Start recording.
5. **Walk through the GN modifier panel** (right side Properties → wrench icon):
   expand each node group to show the Shortest Edge Paths node and Edge Paths to Curves.
   This is the most important teaching moment — the viewer needs to see which nodes
   do the work.
6. Orbit the viewport with **Middle Mouse** to show the terrain in 3-D. Tilt to a
   top-down view to show the drainage-basin structure (ridges isolate basins).
7. Try adjusting `VALLEY_THRESHOLD` live (edit in the Scripting workspace, re-run
   just the `_make_terrain()` block with a fresh threshold). Record the visual change.
8. Stop recording. Trim to ≈ 60–90 seconds.

## What to emphasise visually

- The **valley convergence**: multiple blue river paths converging toward the same
  low point — this is the Dijkstra spanning tree in action.
- The **taper**: rivers are thin at the ridgetops and widen toward the valley floor.
  Pause on a close-up of a valley to show the width gradient clearly.
- The **GN node graph** in the Node Editor: the chain
  `Shortest Edge Paths → Edge Paths to Curves → Set Curve Radius → Curve to Mesh`.
  Show this layout for at least 5 seconds so viewers can read the node names.
- The **Spreadsheet editor** in Point domain showing `elevation`, `is_valley`,
  and `is_ridge` attributes on the terrain vertices.

## Thumbnail frame

A top-down viewport view at ≈ 45° tilt, centred on the densest valley, shows the
complete drainage basin structure. Use EEVEE render for the thumbnail (not viewport
capture) — the river emission bloom is stronger in rendered output.
