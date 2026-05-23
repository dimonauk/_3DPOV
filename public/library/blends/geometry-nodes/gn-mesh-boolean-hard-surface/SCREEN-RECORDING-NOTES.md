# Screen Recording Notes — GN Mesh Boolean Hard Surface

**Target file:** `public/library/videos/geometry-nodes/gn-mesh-boolean-hard-surface/screen.mp4`
**Tool:** OBS Studio (or Windows Game Bar Win+G / macOS Screenshot toolbar)
**Settings:** Window capture = Blender, 1920×1080, 30 fps, audio off

---

## Shot list

### Shot 1 — Load the blend and open Geometry Nodes editor (0:00–0:30)

1. Open `output/panel_boolean.blend`.
2. In the 3D Viewport header, set viewport shading to **Material Preview** (sphere icon, or `Z` → Material Preview).
3. Select `panel_boolean`.  The panel should show a grid of round holes.
4. Split the viewport: drag the right edge of the 3D Viewport leftward to create a second area.  Set the right area to **Geometry Node Editor** (header icon or Shift+F3).
5. In the GN editor the `GNBooleanHoles` node tree is now visible.
6. Pan the GN editor so the **Mesh Boolean** node is centred on screen.

*What to show:* the completed node tree with all five nodes visible — GroupInput → DistributePoints → InstanceOnPoints → RealizeInstances → MeshBoolean → SetShadeSmooth → GroupOutput.

---

### Shot 2 — Live Hole Density slider (0:30–1:00)

1. With `panel_boolean` selected, open the **Properties** sidebar → **Object** tab → **Geometry Nodes** modifier panel (wrench icon).
2. Drag the **Hole Density** slider from 0 to 10.  Watch holes appear and fill the panel in real time.
3. Set Density back to 4.0.

*What to show:* the solver updating the mesh live — pause briefly at density 8 to show how the holes crowd together, demonstrating why the Poisson solver enforces minimum spacing.

---

### Shot 3 — Inspect the Mesh Boolean node (1:00–1:45)

1. In the GN editor, click the **Mesh Boolean** node to select it.
2. Show the **Solver** property set to **Exact** in the node header.
3. Temporarily switch to **Fast** and scrub the density slider to 12.  Show the artefact (broken geometry or inverted faces at high density).
4. Switch back to **Exact**. Geometry repairs itself.

*What to show:* the qualitative difference between Fast and Exact solvers at overlapping cutter density.

---

### Shot 4 — Realise Instances requirement demo (1:45–2:15)

1. In the GN editor, disconnect the link between **Realize Instances → Mesh Boolean**.  Instead connect **Instance on Points → Mesh Boolean** directly.
2. Show the 3D Viewport: the boolean has no effect (panel is intact or shows an error shader).
3. Reconnect via **Realize Instances**.  Holes return.

*What to show:* the `GeometryNodeMeshBoolean` requires a Mesh input — Instances type is not accepted.  This demonstrates WHY Realize Instances sits between scatter and boolean.

---

### Shot 5 — Export GLB (2:15–2:45)

1. Open a **Scripting** workspace tab.
2. Show the `blueprint.py` export call:
   ```python
   bpy.ops.export_scene.gltf(
       filepath="...",
       export_apply=True,  # ← evaluate GN before export
       ...
   )
   ```
3. Run the script.  Switch to a file manager panel showing the `output/` folder and the `panel_boolean.glb` file appearing.

---

### Shot 6 — Verify in glTF Viewer (2:45–3:00)

1. Open a browser and drag `panel_boolean.glb` onto **Don McCurdy's glTF Viewer** (gltf.report or gltf-viewer.donmccurdy.com).
2. Show the panel with correctly punched holes and smooth curved walls.
3. Inspect the **Mesh** tab in the viewer to confirm face count.

---

## Post-production notes

- Trim silence and any false starts before the final encode.
- Export as H.264 MP4, 30 fps, 1920×1080, CRF 22.
- Save to `public/library/videos/geometry-nodes/gn-mesh-boolean-hard-surface/screen.mp4`.
- No voiceover required — the README and tutorial page provide the commentary.
