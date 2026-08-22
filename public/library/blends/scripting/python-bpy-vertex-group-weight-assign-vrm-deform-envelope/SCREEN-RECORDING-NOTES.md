# Screen Recording Notes — Vertex Group Scripting Tutorial

## OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| Output path | `public/library/videos/scripting/python-bpy-vertex-group-weight-assign-vrm-deform-envelope/screen.mp4` |

## What to record (shot order)

1. **Script Editor open** — paste `blueprint.py`; show constants at top.
2. **Step 1 run** — scroll to armature creation block; highlight `temp_override(active_object=arm_ob)` and `mode_set(mode='EDIT')`. Run. Show armature in 3-D View.
3. **Step 2 run** — cylinder mesh appears; tumble viewport to show proportions.
4. **Step 3 highlight** — `vg.add([v.index], w, 'REPLACE')` line; scroll the code slowly. Talk through REPLACE vs ADD. Run.
5. **Weight Paint mode** — switch to Weight Paint (`Ctrl+Tab`), orbit to show blue/red gradient bands on the cylinder. Hold for 3 s.
6. **Step 4 run** — normalise; switch to Python console; `print(sum(g.weight for g in C.object.data.vertices[8].groups))` to confirm 1.0.
7. **Step 5 run** — envelope bake overwrites groups; Weight Paint again to show envelope-based distribution.
8. **Step 6 run** — GLB exports; confirm file in OS file manager sidebar.

## Editing notes

- Trim dead air between script pastes.
- Add a 2-second freeze frame when Weight Paint gradient is visible.
- Subtitle cards:  
  - "REPLACE vs ADD — why first write must be REPLACE"  
  - "Normalise before GLB — VRM requires sum = 1.0"  
  - "Bake overwrites manual weights — order matters"
