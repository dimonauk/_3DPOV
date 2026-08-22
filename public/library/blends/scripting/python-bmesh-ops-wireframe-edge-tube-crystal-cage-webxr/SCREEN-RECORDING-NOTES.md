# Screen Recording Notes — bmesh.ops.wireframe Crystal Cage

## OBS Setup

| Setting        | Value                        |
|----------------|------------------------------|
| Window source  | Blender (not desktop capture)|
| Resolution     | 1920 × 1080                  |
| Frame rate     | 30 fps                       |
| Audio          | Disabled                     |
| Output         | `screen.mp4` (MP4 / H.264 / CRF 23) |

## Sequence to Record

1. Open **Blender 5.1**. Set the workspace to **Scripting**.
2. Open `blueprint.py` in the Text Editor. Run it with **Alt+P**.
3. Switch to the **Layout** workspace. Both objects — `hf_wireframe_cage` and
   `hf_wireframe_grid_hud` — should appear in the 3D viewport.
4. Set viewport shading to **Material Preview** (Z → Material Preview) to see
   the emissive wire colour against the dark background.
5. Start OBS recording.
6. Select `hf_wireframe_cage`. Orbit slowly with **Middle Mouse + drag** to
   show the full hollow lattice from all angles. Pause on a close-up of a
   junction to demonstrate even tube thickness.
7. Select `hf_wireframe_grid_hud`. Orbit to show the semi-transparent fill
   behind the emissive wire lines.
8. Open the **Python Console** and type the following to narrate live:
   ```python
   import bpy, bmesh
   bm = bmesh.new()
   bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
   r = bmesh.ops.wireframe(bm, faces=bm.faces[:], thickness=0.045, use_replace=True, use_even_offset=True)
   print(f"{len(r['faces'])} tube quad faces from {len(bm.edges)} edges")
   bm.free()
   ```
9. Stop OBS recording. Save to:
   `public/library/videos/scripting/python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr/screen.mp4`

## Talking Points

- "bmesh.ops.wireframe is the same C kernel that powers Blender's Wireframe
  tool in Edit Mode — but here we call it headless from a script, no context
  required."
- "Each original edge becomes four quad faces forming a rectangular tube.
  120 edges on the subdivided icosahedron → 480 tube quads."
- "use_replace=True is what makes it hollow — the fill triangles are deleted,
  leaving only the lattice skeleton."
- "use_even_offset compensates angled junctions; without it narrow-angle
  junctions look thinner than right-angle ones."
- "The grid HUD uses use_replace=False and material_offset=1 so the fill
  panel and the wire lines carry separate material slots — one semi-transparent,
  one emissive."
