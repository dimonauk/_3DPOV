# Screen Recording Notes
## python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr

### Purpose

Capture `blueprint.py` being executed in Blender's Text Editor, showing a flat
subdivided quad conform to a noisy icosphere dome using `ShrinkwrapModifier` in
PROJECT mode — and the teal emissive decal materialising on the surface.

### OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output file | `screen.mp4` |
| Encoder | x264, CRF 23, preset `fast` |

### Blender Layout Before Recording

1. Open Blender → File → New → General.  Delete the default cube (`X`).
2. Split the viewport: drag the top-right corner of the 3D Viewport leftward
   to create a second panel.  Set the right panel to **Text Editor**.
3. In the Text Editor: click **New**, paste `blueprint.py`.
4. Set the 3D Viewport to **Solid** mode, **User Perspective** (numpad 5 to
   toggle orthographic → perspective if needed).
5. Set the Viewport Shading overlay to show **Face Orientation** so the
   normals-after-conform step is visible (blue = outward = correct).

### Recording Steps

1. Start OBS recording.
2. Walk through `blueprint.py` in the Text Editor, section by section:
   - Read the module-level docstring aloud (or annotate with on-screen text if
     you are adding titles in post).
   - Highlight the `CONSTANTS` block — point out `DECAL_CUTS = 8` and explain
     why subdivision density matters for conform quality.
3. Run the script (`Alt+P` or the **Run Script** ▶ button in the header).
4. Switch focus to the 3D Viewport.  The dome and decal should appear.
   - Orbit (`middle-mouse-drag`) to view the decal draped over the dome.
   - Zoom in on one edge of the decal to show the 0.002 m lift.
5. Toggle **Face Orientation** in Viewport Overlays → confirm decal faces are
   blue (outward-facing normals from `recalc_face_normals`).
6. In the Properties panel → **Modifier Properties** for `hf_decal` — show the
   empty stack (Shrinkwrap has been applied).
7. Open the Python Console and run:
   ```python
   d = bpy.data.objects["hf_decal"]
   print("verts:", len(d.data.vertices))
   # expected: 81 (9×9 grid)
   ```
8. Optionally, open the **N-panel → Item → Location** for `hf_decal` — the Z
   value will reflect the dome surface position rather than the original launch
   height, confirming the apply occurred.
9. Stop OBS recording.

### Target Duration

3–5 minutes.
