# Screen Recording Notes
## Python bpy.types.FileHandler — GLB Drag-Drop Extension Extractor

**Target file:** `public/library/videos/scripting/python-file-handler-gltf-drag-drop-extension-extractor/screen.mp4`

---

### Software

- **OBS Studio** 30.x (Windows/Linux) or **QuickTime Screen Recording** (macOS)
- Blender 5.1

### OBS Settings

| Setting | Value |
|---------|-------|
| Source | Display Capture or Window Capture → Blender |
| Base Resolution | 1920 × 1080 |
| Output Resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 or NVENC |
| Audio | Disabled |
| Output format | MP4 |

---

### Scene Setup Before Recording

1. Open Blender 5.1 to the default startup scene.
2. Open the **Text Editor**, paste `blueprint.py`, press **Run Script**.
3. A confirmation message in the info bar confirms registration.
4. Open a **File Manager** (Explorer / Nautilus) window side by side with Blender.
5. Navigate to a test `.glb` that has `holoflow:` extras (or export one via the
   `holoflow_webxr_exporter` add-on with any mesh that has `holoflow:facet` set).

### What to Record (~60 s)

| Segment | Action | Notes |
|---------|--------|-------|
| 0–5 s | Show the Blender viewport and file manager side by side | |
| 5–12 s | Hover over `blueprint.py` in the Text Editor | Highlight `bl_file_extensions` and `poll_drop` |
| 12–20 s | Drag the `.glb` file from the file manager onto the Blender 3D Viewport | Drop it squarely inside the viewport |
| 20–30 s | The import completes; imported object appears | Show the Info bar — "applied N holoflow: properties" |
| 30–45 s | Select the imported object; open Properties (N) > Item > Custom Properties | Scroll to reveal `hf:facet`, `hf:tag`, `hf:lod` entries |
| 45–60 s | Open `blueprint.py` Text Editor; scroll to `_read_glb_json` | Annotate the struct.unpack call with the mouse pointer |

### Post-Processing

- Trim to remove dead air at start/end.
- No colour grading needed.
- Save as `screen.mp4` and move to the target path above.
