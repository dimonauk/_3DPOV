# Screen Recording Notes — NodeTreeInterface Socket API Tutorial

**Blender version**: 5.1  
**OBS profile**: Holoflow-Tutorial-30fps  
**Output**: `public/library/videos/scripting/python-bpy-node-tree-interface-gn-socket-api-4x/screen.mp4`

---

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 (medium preset) |
| Audio | Disabled |
| Output format | MP4 |

---

## Scene to Record

Open a **fresh Blender 5.1** — do not use a file with an existing GN setup.

### Section 1 — Show the broken 3.x API (30 s)

1. Open the **Scripting** workspace.
2. Paste this into the Text Editor and run it:
   ```python
   import bpy
   ng = bpy.data.node_groups.new("Demo", "GeometryNodeTree")
   ng.inputs.new("NodeSocketFloat", "Width")   # WILL RAISE AttributeError
   ```
3. Let the console show the `AttributeError: 'GeometryNodeTree' object has no attribute 'inputs'` error.
4. Pause on the red console output for 3 seconds.

### Section 2 — Show the 4.0+/5.1 way (60 s)

5. Clear the text editor, paste and run `blueprint.py`.
6. Switch to the **Geometry Nodes** workspace.
7. Select the `radial_fan` object. The GN modifier panel should be visible in Properties → Modifier.
8. Expand the **Fan Controls** panel inside the modifier. Show the typed sliders: Blade Count, Blade Radius, Blade Scale, Blade Twist, Blade Thickness.
9. Change **Blade Count** from 9 → 3 → 16 in the viewport. Pan to show the geometry updating.
10. Open the **node editor** (already in GN workspace). Show the interface list on the left panel — highlight how sockets are grouped under "Fan Controls".

### Section 3 — Print the identifier map (20 s)

11. In the System Console (Window → Toggle System Console on Windows / terminal on Mac/Linux), show the printed `Socket identifier map:` block. Emphasise that modifier keys use `identifier`, not `name`.

### Section 4 — GLB in viewport (20 s)

12. Confirm the GLB was exported (show file browser or terminal path).
13. Optional: drag the `radial_fan.glb` into the Holoflow WebXR viewer tab to show it loading.

---

## Post-processing (DaVinci Resolve / Kdenlive)

- Cut dead air between sections.
- Add chapter markers at 0:00, 0:30, 1:30, 2:30.
- No music — let Blender UI sounds come through if mic was on.
- Colour grade: Studio/Default LUT, no saturation push.
- Export: H.264 CRF 20, 1920×1080, 30fps.
