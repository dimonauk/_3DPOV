# Screen Recording Notes
## GN Bevel Mesh + Edge-Angle Limit — Selective Hard-Surface Chamfer

### Software
- OBS Studio (or Windows Game Bar Win+G)
- Source: Window Capture → Blender 5.1
- Resolution: 1920 × 1080, 30 fps
- Audio: OFF (mute all input sources)
- Output: `public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer-hard-surface/screen.mp4`

---

### Workspace setup before recording

1. Open Blender 5.1, switch to the **Scripting** workspace.
2. Run `blueprint.py`. The control panel slab appears with chamfered hard edges.
3. Switch to the **Geometry Nodes** workspace. The `BevelAngle_GN` modifier is visible.
4. Set viewport shading to **Material Preview** (Shift+Z → Material Preview).
5. Check camera view (Numpad 0) — the panel with chamfered corners should be visible.

---

### Takes

**Take 1 — Blueprint run (Scripting workspace)**
- Show the open `blueprint.py`.
- Scroll to the constants block. Hover over `BEVEL_WIDTH` and `ANGLE_THRESHOLD`.
- Click **Run Script**. The panel mesh appears in the 3D viewport inset.
- Duration: ~40 seconds.

**Take 2 — GN node graph walkthrough (Geometry Nodes workspace)**
- Show the node tree: Group Input → Bevel Mesh → Set Shade Smooth → Group Output.
- Click on the Bevel Mesh node. In Properties panel show `mode=EDGES`, `limit_method=ANGLE`.
- Drag the **Bevel Width** socket value from 0.001 to 0.04 live — the chamfer grows.
- Drag back to 0.018.
- Duration: ~60 seconds.

**Take 3 — Angle threshold comparison (Geometry Nodes workspace)**
- Set **Angle Threshold** socket to `math.radians(5)` (≈0.087 rad) — only near-horizontal edges bevel (almost nothing).
- Set to `math.radians(60)` — every edge bevels, including shallow ones.
- Set to `math.radians(25)` — only hard 90° corners bevel. Inset edges also bevel.
- Duration: ~45 seconds.

**Take 4 — Segments comparison**
- Set **Segments** to 1 — flat chamfer plane.
- Set to 4 — smooth rounded bead.
- Set back to 2 — the production value.
- Duration: ~30 seconds.

**Take 5 — GLB export check**
- Switch to Scripting workspace, open a Python console.
- `import bpy; ob = bpy.data.objects['control_panel']; bpy.ops.object.modifier_apply(modifier='BevelAngle_GN')`
- `bpy.ops.export_scene.gltf(filepath='//hs_control_panel.glb', export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6)`
- Show the file in the OS file browser (the .glb file appears).
- Duration: ~30 seconds.

---

### Editing notes
- Cut between takes without cross-fades.
- Top-and-tail each take to remove dead time before/after actions.
- Total runtime target: 3–4 minutes.
- No voiceover needed for the library cut; narration is added in the tutorial video edit.
