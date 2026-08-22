# Screen Recording Notes — GN Index of Nearest: Circuit Board Panel

## OBS / Xbox Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` (H.264, CRF 22) |

## What to capture

1. Open Blender 5.1 and run `blueprint.py` from the Text Editor (Alt+P).
   Pause 3 seconds so the viewer can see the finished circuit board panel.

2. Switch to the Geometry Nodes editor. Pan to the core section of the tree:
   - Distribute Points on Faces → **Index of Nearest** → Evaluate at Index →
     VectorMath subtract/length/normalise → Align Euler to Vector →
     CombineXYZ → InstanceOnPoints → RealizeInstances.
   - Hover each node for 2–3 seconds; the on-screen tooltip shows socket names.

3. Return to the 3D viewport. In the N-panel ▸ Modifier properties, scrub the
   `Density` value from 10 → 160 slowly to show the web growing.
   This is the key beat: the connection web adapts live as point count changes.

4. Press Numpad 7 (top view), then Numpad 1 (front view) to show the panel is
   flat — a single-faced WebXR prop.

5. Open a terminal / system console and run the export from `blueprint.py`
   (or call `bpy.ops.export_scene.gltf(...)` from the Python console).
   Show the `circuit_board_panel.glb` file appearing in the output folder.

## Aim for 45–90 seconds total.
