# Screen Recording Notes — HF Export Diagnostics Node
**For screen.mp4 capture (1920×1080, 30 fps)**

---

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | Off (tutorial-only narration added in post) |
| Output | `public/library/videos/scripting/python-bpy-custom-shader-node-type-export-diagnostics/screen.mp4` |

---

## Recommended takes

### Take 1 — Register and add the node (≈ 60 s)

1. Open a new Blender file.  Open the **Text Editor**.  Paste `blueprint.py`.
2. Press **Run Script**.  Console shows the registration confirmation line.
3. Open a **Shader Editor** (split the screen).  Select the default Cube and
   open its material (or create one).
4. Press **Shift+A** in the Shader Editor.  Show the **Holoflow** category at
   the bottom of the Add menu.  Click **HF Export Diagnostics**.
5. The node appears.  All three sockets are **red** (no WebP textures, no UV
   Map node linked, but Principled BSDF is already there so BSDF OK turns
   green immediately).

### Take 2 — Watch sockets change colour (≈ 90 s)

1. Add an **Image Texture** node.  Load any PNG image.  Connect its Colour
   output to the Base Color input of the Principled BSDF.
2. Return to the Diagnostics node — **WebP Ready** socket is still red (PNG is
   not WebP).  Demonstrate by showing `Image.file_format` in the Info log or
   by hovering over the image data-block.
3. In the Properties editor, change the image format to WebP (Image → Format →
   WebP) and save a copy.  Load the WebP version.  The **WebP Ready** socket
   turns **green**.
4. Add a **UV Map** node (Shift+A → Input → UV Map).  Leave it unlinked.  The
   **UV Valid** socket is still red.  Wire the UV Map to the Vector input of the
   Image Texture — socket turns **green**.

### Take 3 — Batch script query (≈ 60 s)

1. In the Text Editor, show a short script that iterates materials and reads:
   ```python
   for mat in bpy.data.materials:
       for node in mat.node_tree.nodes:
           if node.bl_idname == "ShaderNodeHFExportDiagnostics":
               print(mat.name, node.outputs["WebP Ready"].default_value)
   ```
2. Run it.  The console prints the pass/fail state for each material — showing
   the node as a queryable data source, not just a visual overlay.

### Take 4 — Run record.py (≈ 20 s)

1. Open `record.py` in the Text Editor.  Press Run Script.
2. Show the render progress in the Info header.
3. Show the printed ffmpeg command in the console.

---

## Edit notes

Cut between takes 1–3 for the main tutorial video.  Use Take 4 as the final
segment to bridge to the `viewport.mp4` footage.  Crop the taskbar out of the
bottom of every frame.
