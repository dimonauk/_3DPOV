# Screen Recording Notes — Depsgraph Evaluated Geometry Tutorial

## Software
- OBS Studio (or Windows Game Bar Win+G / macOS Screenshot.app)
- Blender 5.1

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no mic for this recording) |
| Output format | MP4 (H.264) |
| Bitrate | 8000 kbps (CRF 18 equivalent) |
| Output file | `screen.mp4` beside this file |

## Recording Script

### Part 1 — The Problem (0:00–0:45)
1. Open a fresh Blender 5.1 scene.
2. Open the **Scripting workspace**.
3. In the Python console, type:
   ```python
   import bpy
   plane = bpy.data.objects["Plane"]
   print(len(plane.data.vertices))   # → 4  (the ORIGINAL, unmodified)
   ```
4. Switch to the **Properties panel → Modifier** tab and add a
   **Geometry Nodes** modifier with a simple scatter tree.
5. Return to the Python console. Type the same line again.
   Show the output is still `4` — this is the "original" problem.

### Part 2 — The Depsgraph Fix (0:45–2:30)
1. Type the evaluated version:
   ```python
   dg = bpy.context.evaluated_depsgraph_get()
   plane_eval = plane.evaluated_get(dg)
   em = plane_eval.to_mesh(preserve_all_data_layers=True, depsgraph=dg)
   print(len(em.vertices))   # → much larger
   plane_eval.to_mesh_clear()
   ```
2. Zoom the console so the line `to_mesh_clear()` is clearly visible —
   this is the most-forgotten step and deserves camera focus.

### Part 3 — Instance Iteration (2:30–4:00)
1. Open `blueprint.py` in the Text Editor.
2. Navigate to `pattern_instance_list()` and walk through the
   `dg.object_instances` loop live.
3. Run the function from the console and show the printed list of
   instance matrices.

### Part 4 — Batch Export (4:00–5:30)
1. Run `batch_export_instances("CrystalScatter")` from the console.
2. Open a File Browser to `//depsgraph_batch/` and show the resulting
   `crystal_0000.glb`, `crystal_0001.glb`, … files.
3. Drag one GLB into the viewport to demonstrate it loaded at origin
   with the correct world-space transform baked in.

## Output Location
Place `screen.mp4` at:
```
public/library/videos/scripting/
python-depsgraph-evaluated-geometry-gn-instances-batch-export/
screen.mp4
```
