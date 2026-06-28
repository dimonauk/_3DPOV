# Screen Recording Notes — bpy.msgbus Reactive Property Subscriptions

## Target file
`public/library/videos/scripting/python-msgbus-reactive-property-subscriptions/screen.mp4`

## OBS / Game Bar setup

**Source**: Window Capture → select the Blender 5.1 application window  
**Resolution**: 1920 × 1080  
**Frame rate**: 30 fps  
**Audio**: OFF (no microphone)  
**Encoder**: x264 or NVENC, CRF 18 (high quality)

## Blender layout before recording

1. Split the screen: **Scripting workspace** on the left (60 %), **3D Viewport** (Material Preview) on the right (40 %)
2. Open the Blender **System Console** (Window > Toggle System Console) — this shows the msgbus callback print lines
3. Keep the **Python Console** visible at the bottom (add an editor area)
4. N-panel open in the 3D Viewport → **Item** tab showing Custom Properties

## Recording script

| Timestamp | Action |
|---|---|
| 0:00 | Show `blueprint.py` already loaded in the Scripting editor |
| 0:05 | Press **Run Script** — watch System Console: "registered: 2 class-level + 3 per-object subscriptions" |
| 0:15 | Click `hs_sphere` in viewport → N-panel → Custom Properties → toggle **Holoflow Facet** ON |
| 0:22 | Show System Console: "per-object: hs_sphere.facet → dirty" |
| 0:30 | Toggle `hs_cylinder.holoflow.facet` ON |
| 0:38 | Switch to Python Console; type `export_dirty_objects()` and press Enter |
| 0:45 | Show console output: "hs_sphere → //output/hs_sphere.glb" etc. |
| 0:55 | Show N-panel: dirty flags cleared back to False |
| 1:05 | Rename `hs_cube` in the outliner — show "an object was renamed" in console |
| 1:15 | Call `bpy.msgbus.clear_by_owner(OWNER_TOKEN)` in Python Console |
| 1:22 | Toggle facet again — no console output (subscriptions cleared) |
| 1:30 | END |

## Post-processing

Trim to ≤ 90 seconds.  No colour grading needed.  Export as MP4 H.264, 30 fps,
bitrate ~4 Mbps.  Name exactly `screen.mp4` and place in the videos folder above.
