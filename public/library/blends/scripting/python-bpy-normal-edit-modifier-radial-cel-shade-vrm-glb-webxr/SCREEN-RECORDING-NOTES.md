# Screen Recording Notes
## python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr

### Purpose
Capture `blueprint.py` being run in Blender's Text Editor, showing the
flat-polygon gem appear in the 3D Viewport with smooth-looking toon shading —
and then toggling the NormalEditModifier on/off to illustrate the before/after.

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
3. Split the viewport: drag the top-right corner of the 3D Viewport leftward
   to create a second panel. Set the right panel to **Text Editor**.
4. In the Text Editor: New → paste `blueprint.py`.
5. Set the 3D Viewport to **Material Preview** mode (Z → Material Preview).
   This uses EEVEE and will show the sphere-normal shading effect live.

### Recording Steps

1. Start OBS recording.
2. Walk through `blueprint.py` key sections in the Text Editor:
   - Read the CONSTANTS block (explain GEM_SCALE_Z, DISSOLVE_ANGLE,
     MIX_FACTOR, the BASE vs TOP group weights).
   - Point out the `shade_smooth()` call — mention that this is mandatory.
   - Show the `add_normal_edit_modifier` function — highlight `mode='RADIAL'`
     and `mix_factor=MIX_FACTOR`.
3. Run the script (Alt+P or **Run Script** button).
4. Switch to the 3D Viewport — the gem should appear with gradient toon shading.
5. In the Properties panel → **Object Data Properties → Normals**:
   - Show that custom split normals are present (the NE modifier baked them).
6. In **Modifier Properties** (wrench icon):
   - The stack should be empty (modifiers were applied during bake).
   - If you run without baking, show the live modifier stack here instead.
7. Toggle viewport shading between **Solid** and **Material Preview** to
   show the contrast between flat unshaded and toon-sphere-shaded views.
8. In the Python Console, run:
   ```python
   gem = bpy.data.objects["hf_normal_edit_gem"]
   print(len(gem.data.vertices), len(gem.data.polygons))
   # Expected: ~12 verts, ~10 faces (after limited_dissolve)
   ```
9. Stop OBS recording.

### Target Duration

3–5 minutes.
