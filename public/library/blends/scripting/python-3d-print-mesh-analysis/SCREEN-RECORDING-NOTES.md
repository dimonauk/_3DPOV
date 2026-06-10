# Screen Recording Notes — python-3d-print-mesh-analysis

Target file: `public/library/videos/scripting/python-3d-print-mesh-analysis/screen.mp4`

## Software

- OBS Studio (free) or Windows Game Bar (Win+G) or macOS Screenshot.app
- Blender 5.1

## OBS Setup

1. **Source**: Window Capture → select the Blender window
2. **Resolution**: 1920 × 1080 (crop if Blender is a different size)
3. **Frame rate**: 30 fps
4. **Audio**: disabled (tutorial is caption-only)
5. **Output format**: MP4 / H.264, CRF 20

## Windows Game Bar

- Win+G → Capture → Start Recording
- Or: Win+Alt+R to start/stop without opening the overlay

## What to record

### Part 1 — blueprint.py walkthrough (approx. 3 min)

1. Open Blender 5.1 → switch to the **Scripting** workspace
2. Click **Open** → navigate to `blueprint.py`
3. Scroll slowly through the **PROFILE** constant — pause on each (radius, z) pair
   and let viewers see the pawn silhouette implied by the numbers
4. Scroll to `build_pawn_mesh()`:
   - Hover over `rings.append(...)` — explain the pole vs. ring branch
   - Hover over `recalc_face_normals` — key point: why normals need a post-pass
5. Scroll to `analyse_and_tag()`:
   - Point out `edge.is_manifold` — every edge in a watertight mesh touches exactly 2 faces
   - Point out `bm.calc_volume()` — explain the signed-volume invariant
   - Point out the overhang loop — `max(0, -f.normal.z)` formula
6. Click **Run Script** — watch the Info header for `[holoflow]` lines
7. Switch to **Layout** workspace and show the coloured pawn

### Part 2 — inspection (approx. 2 min)

1. In Layout → numpad 1 for front ortho view — identify the neck and base overhangs
2. Enter **Edit Mode** → Edge select → press Alt+Shift+M (Select All By Trait → Non
   Manifold) — should select nothing if the script ran correctly
3. Back to Object Mode → open the **Python Console** (Shift+F4) and type:
   ```python
   import bpy
   obj = bpy.data.objects["pawn_print_ready"]
   print(obj.data.attributes["overhang_severity"].data[0].value)
   ```
4. Show a few per-face values; pause on a neck underside face (value ≈ 0.8)

### Part 3 — STL check (approx. 1 min)

1. Open a terminal in the same directory as `pawn_print_ready.stl`
2. Run `ls -lh pawn_print_ready.stl` — typical output: ~200–400 KB binary STL
3. Drag the STL into PrusaSlicer or UltiMaker Cura to show the green/red support overlay

## Editing notes

- Trim the render-running wait (record.py execution) to 10-second timelapse
- Add captions for the three formula moments: `edge.is_manifold`, `calc_volume()`, `max(0, -f.normal.z)`
- Suggested title card: **"3D Print Prep in Blender 5.1 — No Add-ons Required"**
