# Screen Recording Notes — Python App Handler Frame-Change Depsgraph

Target file: `public/library/videos/scripting/python-app-handler-frame-change-depsgraph/screen.mp4`

## Setup

| Setting | Value |
|---|---|
| Software | OBS Studio 30+ / Windows Game Bar / macOS Screenshot |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |

## Recording Flow

### Part 1 — Scripting Workspace (≈ 45 s)

1. Open Blender. Switch to the **Scripting** workspace.
2. Open `blueprint.py` via the text editor's **Open** button.
3. Skim the file so the handler body and `@persistent` decorator are visible.
4. **Start recording.** Press **Run Script** (▷). Let the console output finish.
5. Switch to the **3D Viewport** tab (keep recording).
6. Press **Space** to play. Hold for ≈ 10 s so the ripple cycles are visible.
7. Press **Space** again to stop playback.

### Part 2 — Handler Inspection (≈ 20 s)

8. Back in the Scripting workspace, type in the console:

   ```python
   import bpy
   print(bpy.app.handlers.frame_change_post)
   ```

   Show the output listing `_ripple_handler`.

9. Run `_unregister_handler()`. Press **Space** in the 3D Viewport to confirm
   the mesh is now static.

### Part 3 — GLB Snapshot (≈ 10 s)

10. Re-run `blueprint.py` (or call `run()` from the console).
11. Navigate in your OS file browser to show `ripple_grid_frame40.glb` has
    been created.

**Stop recording.**

## Post-Production Notes

- Trim any Blender loading screen at the start.
- Cut between Part 1 and Part 2 to remove dead console time.
- No colour correction needed; EEVEE's default viewport is clean.
- Encode final export at 8 Mbit/s CRF 22 for archive quality.
- Rename output to `screen.mp4` and place in
  `public/library/videos/scripting/python-app-handler-frame-change-depsgraph/`.
