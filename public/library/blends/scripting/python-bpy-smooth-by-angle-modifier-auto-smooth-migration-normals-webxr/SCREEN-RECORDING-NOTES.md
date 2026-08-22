# Screen Recording Notes — SMOOTH_BY_ANGLE Migration Demo

**Session type:** OBS / Game Bar screen capture  
**Window source:** Blender 5.1  
**Resolution:** 1920 × 1080 @ 30 fps  
**Audio:** Off  
**Output:** `public/library/videos/scripting/python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr/screen.mp4`

---

## Setup before recording

1. Open Blender 5.1 → Scripting workspace.
2. Paste `blueprint.py` into the Text Editor.
3. Press **Alt+P** (or Run Script) to generate the prop.
4. Switch to **3D Viewport** → Solid mode, **Viewport Shading: Matcap** (the
   grey sphere with subtle reflection works best for normals inspection).
5. Set **Overlay → Geometry → Face Orientation** ON to confirm outward normals.
6. Zoom to frame the barrel + lid from a 3/4 front angle.

---

## Take sequence

### Take 1 — flat shading (no modifier)
1. In the N-Panel select the object.
2. In Properties → Modifier Properties confirm **no modifiers** are present.
3. Switch to **Viewport Overlay: Normals** (Face Orientation on).
4. Slowly orbit to show the barrel is fully flat-shaded (sharp bands on cylinder
   sides, facets clearly visible on hex lid).
5. **Record 15 s.**

### Take 2 — add SMOOTH_BY_ANGLE via Python console
1. Open the **Python Console** at the bottom.
2. Type and run:
   ```python
   import bpy, math
   obj = bpy.context.active_object
   mod = obj.modifiers.new("Smooth by Angle", 'SMOOTH_BY_ANGLE')
   mod.angle = math.radians(30)
   mod.keep_sharp_edges = True
   ```
3. The viewport updates immediately — cylinder sides go smooth, hex lid stays
   faceted, mid-ring groove (marked `sharp_edge`) stays hard.
4. Orbit slowly to show the contrast.
5. **Record 20 s.**

### Take 3 — Properties panel inspection
1. Open **Properties → Modifier Properties** (wrench icon).
2. Show the Smooth by Angle modifier card.
3. Hover over **Angle** — tooltip should read "Angle past which edges are
   considered sharp — Blender 5.1 replacement for mesh.use_auto_smooth".
4. Scrub the Angle slider from 5° to 90° and back to 30° while orbiting.
5. **Record 20 s.**

### Take 4 — migration helper demo
1. Back in Scripting workspace.
2. Paste and run the `migrate_old_auto_smooth()` call from `blueprint.py`.
3. Check the console output for migration log.
4. **Record 10 s.**

### Take 5 — GLB export
1. Run the full `blueprint.py` script (Alt+P).
2. Open File → Export → glTF 2.0 to confirm file is written.
3. Drag the GLB into the Blender viewport (or open in a browser via Three.js
   viewer) to show normals are preserved.
4. **Record 15 s.**

---

## Edit notes
- Cut between Takes with a 1-frame cross-dissolve.
- Add lower-third text overlay: "SMOOTH_BY_ANGLE — Blender 5.1 | Holoflow Studio".
- No voiceover; on-screen console input is self-documenting.
- Export H.264, CRF 20, 1920×1080.
