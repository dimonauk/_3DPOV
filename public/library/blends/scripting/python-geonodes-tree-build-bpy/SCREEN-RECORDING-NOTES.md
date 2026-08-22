# Screen Recording Notes
## python-geonodes-tree-build-bpy — OBS / Game Bar Instructions

**Target file:** `public/library/videos/scripting/python-geonodes-tree-build-bpy/screen.mp4`

---

### Setup

| Setting | Value |
|---|---|
| Capture source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed — silent screencast) |
| Encoder | x264, CRF 18 |

---

### Shot list

1. **Scripting workspace** (0:00 – 0:10)
   Open Blender → Scripting workspace → Open `blueprint.py`.
   Show the parameter block at the top of the file — zoom in on `NODE_GROUP_NAME`, `NOISE_SCALE`, `NOISE_STRENGTH`.

2. **Run the script** (0:10 – 0:20)
   Click *Run Script* (or Alt+P). Watch the Info bar for `[holoflow]` print messages.
   Switch to Layout workspace — the distorted sphere should be visible.

3. **Inspect the node group in the editor** (0:20 – 0:50)
   Open the *Geometry Node Editor* panel. Select the sphere. The scripted node group appears — pan across it slowly so viewers can read each node label.
   Annotate (N panel → Annotate tool) the path: Position → Noise → VectorMath → SetPosition.

4. **Tweak Scale live** (0:50 – 1:10)
   In the modifier properties, slide the *Scale* input from 0.0 → 0.5 → 0.0. Show the mesh updating in real-time. Scrub the timeline 1 → 60 to show the keyframed growth animation.

5. **Export GLB** (1:10 – 1:20)
   Open `blueprint.py` → scroll to `export_assets()`. Call it via the Python console:
   ```python
   export_assets()
   ```
   Show the GLB file appearing in the output directory.

6. **Verify in gltf.report** (optional, 1:20 – 1:30)
   Drag `geonodes_script_demo.glb` into gltf.report. Show node name, Draco flag, Y-up.

---

### Post-production in Blender VSE

Follow the [VSE screen-recording tutorial](/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export) to:
- Trim handles to remove the mouse fumble at start/end.
- Add a *Color Balance* strip node (lift shadows slightly, cool highlights).
- Export H.264 MP4 at 30 fps, 8 Mbps.
- Place the final `screen.mp4` in `public/library/videos/scripting/python-geonodes-tree-build-bpy/`.
