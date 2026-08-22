# Screen-Recording Notes — Reuleaux Tetrahedron Poi Head

## What to capture

A single Blender session that runs `blueprint.py`, then manipulates the
shape-key sliders by hand to demo the Basis → Puffed → Sphere morphing, and
finally shows the exported GLB in the viewport.

## Setup (do once)

1. Open Blender 5.1.
2. **Workspace** → Scripting.
3. In the Text Editor, open `blueprint.py` from this directory.
4. Set the viewport shading to **Solid → Vertex Colours** before running.

## OBS / Windows Game Bar

| Setting | Value |
|---|---|
| Capture source | Window → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** |
| Output | `screen.mp4` (place alongside this file) |
| Encoder | H.264, CRF 18 (high quality) |

## Shot list

| # | Action | Duration |
|---|---|---|
| 1 | Press **Run Script** in the Text Editor | 0–20 s |
| 2 | Switch to 3-D Viewport, orbit the Reuleaux tetrahedron | 20–40 s |
| 3 | Open the **Item → Shape Keys** panel in the N-panel | 40–50 s |
| 4 | Drag **Puffed** value from 0 → 1 → 0 | 50–70 s |
| 5 | Drag **Sphere** value from 0 → 1 → 0 | 70–90 s |
| 6 | Switch to **Material Preview** to show the emission colours | 90–110 s |
| 7 | Open a file browser, show `hf_reuleaux_tet_poi.glb` was created | 110–120 s |

## Tips

- Pause recording while the script runs (can take 30–60 s on slow hardware).
- Resume once the four coloured patches appear in the viewport.
- Use `Numpad 5` (orthographic) and `Numpad 4/6` to orbit cleanly.
- The shape-key panel is under **Properties → Object Data → Shape Keys**.

## Output file naming

Place the finished file at:
```
public/library/videos/scripting/
  python-numpy-reuleaux-tetrahedron-four-sphere-intersection-meissner-constant-width-poi-webxr/
    screen.mp4
```
