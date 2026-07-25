# Screen Recording Notes — SmoothLife Continuous Cellular Automaton

Tutorial: **Python numpy — SmoothLife: Fourier-Domain Continuous Cellular Automaton**
Output file: `public/library/videos/scripting/python-numpy-smoothlife-fourier-continuous-automaton-webxr/screen.mp4`

---

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration needed) |
| Output format | MP4 (H.264, CRF 18) |

---

## What to Record

### Part 1 — Script execution (~90 s)
1. Open Blender 5.1, new general file.
2. Switch to Scripting workspace.
3. Paste `blueprint.py` into the Text Editor.
4. Press **Run Script** (Alt+P or the ▶ button).
5. Watch the Python Console: the warm-up progress prints each 100 steps.
6. After ~20 s the mesh appears in the 3D Viewport — stop here.

### Part 2 — Shape-key timeline scrub (~30 s)
1. Switch to the **Layout** workspace.
2. Open the **Properties panel → Object Data Properties → Shape Keys** to show the 8 `State_XX` keys.
3. Press **Space** (play) and let the camera scrub through frames 1–192.
4. The SmoothLife surface should ripple and pulse — glider-like blobs moving across the displaced grid.

### Part 3 — Viewport shading inspection (~30 s)
1. In the 3D Viewport, press **Z** → **Material Preview** to show vertex colours.
2. Slowly orbit around the mesh to show the continuous blue-to-orange concentration gradient.
3. Zoom in on a cluster of glider structures.

### Part 4 — Node editor (optional, 20 s)
1. Open the Shader Editor and show an Attribute node (`Col`) feeding into Base Colour — demonstrates how the vertex colour attribute maps to a PBR material for GLB export.

---

## Recommended Blender viewport state before recording
- Viewport shading: **Material Preview** (Z → Material Preview)
- Camera: Numpad 0 to enter camera view
- Overlay: hide grid floor, axes, cursor (N panel → View Overlay)
- Timeline scrub bar visible at bottom

---

## Notes
- Record Part 1 and Part 2 in a single take if possible — the natural pause when the script finishes building the mesh provides a good visual break point.
- The glider structures are most visible in frames 50–150 where several blobs coexist.
- Total target duration for `screen.mp4`: 3–4 minutes.
