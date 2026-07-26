# Screen Recording Notes — Face-Tag Picker

**OBS / Game Bar setup for `screen.mp4`**

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Output path | `public/library/videos/scripting/python-bpy-modal-face-tag-picker-bvh-raycast-gpu-overlay/screen.mp4` |

## What to capture

1. Open `blueprint.py` in the Blender Scripting workspace.
2. Click **Run Script** — the operator is now registered but the viewport is empty.
3. Switch to the **3D Viewport** (Layout workspace).
4. Add a UV sphere (`Shift+A → Mesh → UV Sphere`).
5. Press **F** — the header should read *"Face Tag Picker: LMB paint · Ctrl+LMB erase · RMB/Esc exit"*.
6. LMB-drag across the top hemisphere of the sphere — amber quads appear on each picked face.
7. Hold **Ctrl** and LMB-drag over the same area to erase some tags.
8. Press **RMB** to exit picker mode.
9. Re-enter picker mode with **F** and paint the lower hemisphere.
10. Press **Esc** to exit.
11. Open the **N-panel → Item → Custom Properties** to confirm `holoflow_facet` exists
    on the mesh with multiple integer values.

## Pacing

- Steps 1–4: ~15 seconds (fast setup)
- Steps 5–10: ~30 seconds (the core demo — slow, deliberate brush strokes)
- Step 11: ~10 seconds (attribute inspection close-up)

Total: ~60 seconds.

## Common issues

- **F key does nothing**: the script was not run (header text absent) or Blender focus
  is not on the 3D Viewport. Click once inside the viewport before pressing F.
- **No amber overlay**: draw handler registered but not triggering — toggle shading mode
  once (Solid → Material Preview → Solid) to force a redraw.
- **`holoflow_facet` absent in Custom Properties**: blueprint.py did not reach the
  `_build_bvh` step. Confirm the active object is a Mesh in Object Mode before
  pressing F.
