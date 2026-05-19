# Screen Recording Notes — Faceted Gem

Record this session using OBS Studio or Windows Game Bar. No commentary audio required at this stage — the tutorial video is a visual demo only.

## OBS Scene Settings

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender (select from dropdown after Blender is open) |
| Resolution | 1920×1080 |
| FPS | 30 |
| Audio | Disabled — uncheck all audio tracks for this scene |
| Cursor | Hidden — untick 'Capture Cursor' in Window Capture settings |

## Output

Save to: `public/library/videos/faceted-mesh/faceted-gem/screen.mp4`

Use MP4 container, H.264, CRF 18–22 for quality at a reasonable file size.

## What to Demo (run order)

1. **Open Blender 5.1.** Switch to the Scripting workspace (top tab row).
2. **Open blueprint.py.** Text Editor → Open → navigate to `public/library/blends/faceted-mesh/faceted-gem/blueprint.py`.
3. **Run the script.** Press ▶ (Run Script). Pause so the viewer can see the gem appear in the 3D viewport top-left.
4. **Switch to Material Preview.** Press Z in the 3D viewport → select Material Preview. Orbit slowly around the gem (middle-mouse drag) for ~10 seconds. The facets should each show as a distinct light-catching plane.
5. **Show the flat-normals code.** Scroll the Text Editor to the `for poly in mesh.polygons:` loop (~line 170). Pause ~3 seconds.
6. **Viewport shading check.** Back in the 3D viewport, toggle Overlays → Face Orientation. Blue faces = outward normals. Orbit once more.
7. **Export the GLB.** File → Export → glTF 2.0. Show the export settings panel briefly (Compression enabled, +Y Up, GLB format). Hit Export glTF 2.0.
8. **End recording.**

Total target: 45–90 seconds of footage.

## Tips

- Set Blender's UI theme to the default dark theme for maximum contrast.
- Maximise the Blender window before recording — do not use a floating window.
- If OBS shows a black window, switch Window Capture from 'Windows 10' to 'BitBlt' capture method in the source properties.
