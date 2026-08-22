# Screen Recording Notes
# python-bpy-curve-data-bezier-nurbs-spline-api

Target output: `public/library/videos/scripting/python-bpy-curve-data-bezier-nurbs-spline-api/screen.mp4`

## Software
- OBS Studio or Windows Game Bar (Win + G)
- Blender 5.1

## Settings
- **Source**: Window Capture → select the Blender 5.1 window
- **Resolution**: 1920 × 1080 (crop if Blender is windowed)
- **Frame rate**: 30 fps
- **Audio**: OFF (tutorial narration is added in post)
- **Output format**: MP4 / H.264

## Scene to record

### 1. Scripting workspace — writing the CurveData script (≈ 3 min)
Open the **Scripting** workspace. Create a new script. Type (or paste)
`blueprint.py` section-by-section, pausing on each function so viewers
can read it. Show the header comments explaining why `bpy.data` is used
instead of `bpy.ops`.

### 2. Running the script — Bézier cable appears (≈ 30 s)
Press **Run Script** (▶). Switch to the **3D Viewport**. The S-shaped
cable with bevel tube should appear. Orbit around it to show the bevel
caps and cross-section.

### 3. Editing in the 3D Viewport — handle types (≈ 2 min)
Select the cable object, press **Tab** to enter Edit Mode. The four
control points are visible. Press **N** to show the Item panel. Click
each control point and show its handle type in the sidebar (VECTOR /
AUTO). Manually drag one AUTO point — show how Blender recomputes
neighbouring handles automatically. Press **Tab** back to Object Mode.

### 4. NURBS ring section of the script (≈ 1 min)
Return to Scripting workspace. Highlight the `make_nurbs_ring()`
function. Point out `order_u = 4`, `use_cyclic_u = True`, and the
homogeneous `(x, y, z, w)` coordinate format.

### 5. bevel_factor animation (≈ 30 s)
Switch to the **Timeline**. Scrub through frames 1–48 while watching the
3D Viewport — the cable tube should grow from zero length to full
length. This is the `bevel_factor_end` keyframe animation.

### 6. GLB export (≈ 30 s)
Show the **File > Export > glTF 2.0** dialogue (or the script running
`convert_and_export()`). Note that Draco compression level 6 and WebP
textures are enabled per the Holoflow pipeline spec.

## Tips
- Zoom the font size in the Scripting workspace (Ctrl + scroll) so
  code is readable at 1080p.
- Keep the OBS window-capture source locked to the Blender window so
  it does not accidentally capture the desktop.
- Trim the final MP4 to remove any scripting pauses longer than 3 s.
