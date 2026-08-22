# Screen Recording Notes — bmesh.ops.bridge_loops

## Software
OBS Studio 30+ or Windows Game Bar (Win+G).

## Capture settings
| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent tutorial) |
| Output | `screen.mp4` (H.264, CRF 20) |

## What to record

### Part 1 — Bridge a straight bore (2–3 min)
1. Open a new file → delete default cube.
2. Add › Mesh › Circle (N=12, radius=0.12) — front ring.
3. Duplicate (Shift+D, Z, 0.1) → scale to same radius — back ring.
4. Select both objects → Join (Ctrl+J).
5. Tab → Edit Mode, Edge Select.
6. A to select all edges.
7. Ctrl+E › Bridge Edge Loops.
8. Show the operator panel: Cuts=2, Use Cyclic ON.
9. Tab back → show the closed tube in Material Preview.

### Part 2 — Bridge a tapered socket (1–2 min)
1. New file → two circles: outer radius 0.15 at Z=0, inner radius 0.07 at Z=-0.1.
2. Join → Edit Mode → select all → Bridge Edge Loops.
3. In operator panel: Interpolation = Surface, Smoothness = 0.45, Cuts = 1.
4. Orbit to show the shoulder bulge from both ends.

### Part 3 — Run the blueprint headless (1 min)
1. Open a terminal.
2. `blender --background --python blueprint.py`
3. Show the output line: `[HF] glb → hf_bridge_port.glb`
4. Open the resulting `.glb` in Blender File › Open or in a browser viewer.

### Part 4 — Twist offset demonstration (30 s)
1. On a hexagonal (N=6) bridge, set Twist Offset to 1, 2, 3 and show how
   the quad strip spirals.
2. Reset to 0 for the clean parallel-stripe topology.

## File naming
Save as: `screen.mp4` alongside `blueprint.py`.
