# Screen Recording Notes — GN Fill Curve + Set Spline Type / Hexagonal Badge

Target output: `public/library/videos/geometry-nodes/gn-fill-curve-logo-extrusion-webxr-badge/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source type | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264, CRF 18) |
| Audio | Disabled |

## What to capture (in order)

1. **Open Blender 5.1.** File → New → General.
2. **Run blueprint.py.** Scripting workspace → Open → `blueprint.py` → Run Script.
   The hexagonal gold badge appears in the viewport.
3. **Switch to Material Preview (`Z → Material Preview`).** Show the gold front face
   glowing and the dark metallic sides. Slowly orbit around to show front → side → back.
4. **Open Geometry Nodes editor** (split panel). Expand `GN_FillCurve_Badge`.
   Pan the node tree and pause on:
   - **Set Spline Type** node — hover to show `Spline Type = POLY` in the properties
   - **Fill Curve** node — hover to show `Mode = TRIANGLES`
   - The **Boolean Math × 2** chain (NOT Top, NOT Side) feeding into **Set Material Index**
   - **Smooth by Angle** node — show the `Angle = 30°` input
5. **Live SPLINE_MODE comparison** (optional but highly recommended):
   - In the Scripting tab, change `SPLINE_MODE = 'POLY'` to `SPLINE_MODE = 'BEZIER'`
   - Re-run the script. The badge becomes a rounded near-circle.
   - Change back to `'POLY'`. The hexagon returns. This is the core lesson.
6. **Spreadsheet editor** — switch one panel to Spreadsheet. Select the badge object,
   switch to `Face` domain. Show the `holoflow:facet` column (all values 1.0) and the
   `material_index` column (1 for the front face, 0 for sides and back cap).
7. **Wireframe overlay** — press `Alt+Z` to toggle wireframe. Show the triangulated
   fill mesh with 4 triangles and the 6 extruded side quads.
8. **Final view** — numpad 1 (front), numpad 5 (orthographic), slow orbit to 3/4 angle.

## Duration target

60 – 90 seconds total. No voiceover. Cut dead time between steps.

## Post-processing

Rename output to `screen.mp4` and place alongside `viewport.mp4` in:
`public/library/videos/geometry-nodes/gn-fill-curve-logo-extrusion-webxr-badge/`
