# Screen Recording Notes
## python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr

Output target: `public/library/videos/scripting/python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr/screen.mp4`

---

### OBS Studio setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled (Desktop Audio muted) |
| Output format | MP4 (H.264 / AAC) |
| Bitrate | 8 000 kbps |
| Encoder | x264 (CRF 18) |

### What to record

1. **Open Blender 5.1** with a blank scene.
2. Open the **Scripting** workspace (top menu bar).
3. Click **New** in the text editor to create a blank script.
4. Paste the full contents of `blueprint.py` into the editor.
5. Press **Alt+P** (Run Script).  The console prints vertex / face counts.
6. Switch to the **Layout** workspace.  The Enneper surface appears.
7. Frame it with **Numpad 5** (orthographic) then **Numpad 0** (camera view).
8. Orbit slowly with **Middle-Mouse-Drag** for 10–15 seconds to show the
   faceted saddle topology from multiple angles.
9. Switch back to **Scripting**, highlight the `bpy.ops.export_scene.gltf()`
   call, and briefly show the export parameters.
10. Stop recording.

### Trim points

- Cut before step 1 (skip Blender splash).
- End after step 9 (do not record file-save dialogue).

### Windows Game Bar (alternative)

`Win+G` → Capture → Start Recording.  Trim in Photos or DaVinci Resolve.
Export as MP4, rename to `screen.mp4`, and place in the video output folder.
