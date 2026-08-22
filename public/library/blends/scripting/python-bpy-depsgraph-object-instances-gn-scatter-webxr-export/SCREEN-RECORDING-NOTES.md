# Screen Recording Notes
## python-bpy-depsgraph-object-instances-gn-scatter-webxr-export

**Target file:**
`public/library/videos/scripting/python-bpy-depsgraph-object-instances-gn-scatter-webxr-export/screen.mp4`

---

## OBS Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 / CRF 23 |

---

## What to record (3–5 minutes)

### Part 1 — Run the pipeline (≈1 min)

1. Open Blender 5.1. Close the splash screen.
2. Switch to the **Scripting** workspace (top tab bar).
3. Click **Open** in the Text Editor, navigate to `blueprint.py`.
4. Press **Alt+P** (or the ▶ Run Script button) to execute.
5. Watch the **Info** header at the top: you should see `[resolve] merged N instances` printed in the System Console (Window → Toggle System Console on Windows, terminal on macOS/Linux).

### Part 2 — Inspect the result (≈1 min)

1. Switch to the **3D Viewport** (press `T` to toggle Tool shelf if needed).
2. In **Solid** mode, the `hf_scatter_merged` object should be visible: a field of icosphere copies covering the ground plane.
3. Open the **Outliner** (top-right): point out that `HF_Prop_Ico` is hidden (eye icon off) and `hf_scatter_merged` is the baked static mesh. `HF_Ground` still carries the GN modifier but its output is not exported.

### Part 3 — Live Python Console demo (≈1 min)

1. Switch to the **Python Console** workspace.
2. Paste and run:
   ```python
   import bpy
   dg = bpy.context.evaluated_depsgraph_get()
   insts = [i for i in dg.object_instances if i.is_instance]
   print(f"{len(insts)} virtual instances in depsgraph")
   # Spot-check one: print its world position
   print(insts[0].matrix_world.translation)
   ```
3. The count should match the `[resolve] merged N instances` from Part 1.

### Part 4 — Show the exported GLB (≈30 s)

Open a file browser / terminal and show that `hf_scatter_resolved.glb` exists in the same directory as `blueprint.py`. Optionally drag it into the **3D Viewport** with File → Import → glTF 2.0 to confirm the merged mesh loaded correctly.

---

## Key moments to highlight on-screen

- The `inst.matrix_world` vs `ob_eval.matrix_world` distinction — add a Blender text annotation or pause and type a comment in the Text Editor.
- The `to_mesh()` / `to_mesh_clear()` pair — show the Python Console with `ob_eval.to_mesh()` returning a Mesh type, then `to_mesh_clear()` freeing it.
- The Outliner showing `HF_Prop_Ico` hidden but the resolved `hf_scatter_merged` present — this makes the "virtual vs real" distinction tangible.
