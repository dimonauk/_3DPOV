# Screen Recording Notes — python-bmesh-ops-spin-lathe-arch-faceted-webxr

## OBS Scene Setup
- Resolution: 1920×1080 @ 30 fps
- Output: `screen.mp4` (H.264, CRF 18)
- Window capture: Blender 5.1 full-screen

## Recording Steps

### 1 — Open Blender and paste blueprint.py
- Launch Blender 5.1, factory-settings empty scene
- Switch to **Scripting** workspace
- New text → paste `blueprint.py`
- **Run Script** (Alt+P)
- Show the terminal output confirming `hf_spin_toroid.glb + hf_spin_arch.glb written to …`

### 2 — Inspect the toroid prop
- Switch to **Layout** workspace
- Select `hf_spin_toroid` in the Outliner
- Hit numpad-1 (front ortho) then numpad-5 (toggle persp)
- Orbit with MMB to show the hex-faceted cross-section
- Open the **Mesh** properties panel → vertex count ~126 verts, 108 faces
- In the **Material Properties**, show the two slots (HF_Gold, HF_Copper) and the Z-split assignment

### 3 — Inspect the arch prop
- Select `hf_spin_arch` in the Outliner
- Orbit to show the horseshoe opening (240° gap visible)
- Zoom into one end-cap to show the manually-added quad face
- Toggle **Wireframe** overlay (Alt+Z) — count 4 columns × 12 steps + 2 caps

### 4 — Show the bmesh.ops.spin call in the script
- Return to Scripting workspace
- Scroll to line 119 (the first spin call)
- Zoom so the `bmesh.ops.spin(bm, geom=hex_verts+hex_edges, …)` block is clearly legible
- Scroll down to line 170 (the arch spin) — highlight `use_merge=False` vs `use_merge=True`
- Scroll to lines 183–191 (manual end-cap code with `result['geom_last']`)

### 5 — Run record.py for the viewport animation
- Open a new text block → paste `record.py`
- **Run Script** — watch the OpenGL render strip progress (60 frames, ~30 s)
- Show the output path confirmation in the terminal

### 6 — Close-up of the rendered frames in the image editor
- Switch to **Image Editor**, navigate `Render Result`
- Scrub through frames 1, 30, 60 to show the orbit arc

## Cuts / Notes
- Trim any long render wait to 5 s with a dissolve
- Add a lower-third caption at step 4: `bmesh.ops.spin — geom must include BOTH verts AND edges`
- Keep total duration ≤ 4 minutes
