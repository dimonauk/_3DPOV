# Screen Recording Notes
## Python temp_override — Mesh Repair Pipeline

### Software
- OBS Studio (recommended) or Windows Game Bar (Win+G)
- Blender 5.1

### OBS Settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no narration for this pass) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/scripting/python-context-temp-override-mesh-repair-pipeline/screen.mp4` |

### Session to Record

1. Open Blender 5.1. Split the default layout so the **3D Viewport** occupies
   the left two-thirds and the **Text Editor** occupies the right third.

2. In the Text Editor, paste the contents of `blueprint.py`.

3. In the 3D Viewport Overlay menu (top-right icon), enable **Face Normals**
   and set the length to **0.12**. This makes the flipped normals visible as
   magenta lines pointing inward.

4. Start OBS recording.

5. Press **Run Script** in the Text Editor header. The script:
   - Creates the `holoflow_props` collection with two damaged meshes
   - Calls `main()` which runs the repair pipeline

6. Capture the viewport as the script runs:
   - You will see the two objects appear
   - The face-normal overlay lines should all snap to a consistent outward
     direction after the `normals_make_consistent` call
   - If running fast, scrub the script line-by-line using breakpoints or add
     a `time.sleep(1)` before each repair pass to slow down for the camera

7. After the script completes, zoom in on each mesh and pan the viewport to
   show the clean normals on both objects. Stop recording.

8. Trim the clip in DaVinci Resolve or any editor:
   - Keep: the moment the damaged meshes appear → the repair run → the final
     clean state
   - Cut: any dead air before or after

### Alternative: record.py Render
Run `record.py` from the Text Editor to produce an automated viewport render
at `public/library/videos/scripting/.../viewport.mp4` without OBS.
That file is the fallback when screen.mp4 is not yet recorded.
