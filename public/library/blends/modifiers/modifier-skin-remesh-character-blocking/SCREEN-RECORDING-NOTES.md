# Screen Recording Notes — Skin + Voxel Remesh Character Blocking

## Target output
`public/library/videos/modifiers/modifier-skin-remesh-character-blocking/screen.mp4`

## Software
- OBS Studio 30.x / Windows Game Bar (`Win + G`)
- Blender 5.1 (window source, not fullscreen capture)

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Format | MP4 (H.264, CRF 18) |
| Audio | **Off** |

## Sequence to record (~4 minutes)

1. **Open a fresh Blender scene.** Show the default cube, then delete it.
2. **Open the Scripting workspace.** Load `blueprint.py` via *Text → Open*.
3. **Run the script.** Switch to the 3D Viewport to show the edge skeleton appearing (zoom out so all verts are visible).
4. **Properties panel → Modifiers tab.** Show the three modifiers stacked: Skin, Remesh (VOXEL), Decimate (Dissolve). Click each header to expand settings. Point out:
   - Skin: `use_smooth_shading` is **off** (flat tubes)
   - Remesh: `Voxel Size` = 0.055 m
   - Decimate: `Angle` = 5°
5. **Disable then re-enable Remesh** (eye icon) to contrast raw Skin output vs. voxel blob.
6. **Edit Mode** — select the head vertex (index 0), show the `Root` flag in the N-panel → Skin section.
7. **Adjust radius live**: select elbow vertex, press `Ctrl+A` to resize, drag to show how the cross-section changes (undo after).
8. **Material preview** (viewport shading `Z → Material Preview`). Orbit to show the flat-faceted clay look.
9. **File → Export → glTF 2.0**. Show the export dialog with *Apply Modifiers* ticked.
10. **End** on the rotating turntable output (play `record.py` or run a manual viewport render).

## Edit notes
- Cut the "script runs" wait time to ~2 seconds using a jump cut.
- Add a title card: *"Skin Modifier + Voxel Remesh — Blender 5.1"*
- Add a lower-third at the radius-resize step: *"Ctrl+A — resize skin cross-section"*
- Crop to 1280 × 720 if uploading to a short-form feed.
