# Screen Recording Notes
## python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr

### Purpose
Capture `blueprint.py` being typed and executed interactively in Blender's
Text Editor, showing the Boolean + Weld result appear in the 3D Viewport.

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

1. Open a new Blender file (File → New → General).
2. Delete the default cube (`X`).
3. Split the viewport — drag the top-right corner of the 3D Viewport left to
   create a second area. Set the right area to **Text Editor**.
4. In the Text Editor: New → paste `blueprint.py`.
5. Set the 3D Viewport to **Solid** mode, **User Perspective**.

### Recording Steps

1. Start OBS recording.
2. In the Text Editor, walk through `blueprint.py` section by section:
   - Read CONSTANTS aloud or annotate.
   - Run the script (Alt+P or Run Script button).
3. Switch to 3D Viewport — the pedestal prop should appear (flat plate with
   hexagonal column merged into its top face).
4. Orbit (Numpad 4/6) to inspect the seam-free junction.
5. Open Properties → Modifier Properties — show empty stack (both modifiers
   applied).
6. In Outliner — show that `hf_column` no longer exists.
7. Open Python Console and run:
   ```python
   m = bpy.data.objects["hf_boolean_weld_prop"].data
   print(len(m.vertices), len(m.polygons))
   ```
8. Stop OBS recording.

### Target Duration

3–5 minutes.
