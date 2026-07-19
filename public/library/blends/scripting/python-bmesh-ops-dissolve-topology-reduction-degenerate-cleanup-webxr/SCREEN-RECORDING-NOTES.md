# Screen Recording Notes
## Tutorial: bmesh.ops dissolve family — Topology Reduction Pipeline

### Software
- Blender 5.1
- OBS Studio (or Windows Game Bar: Win + G)

### OBS Settings
- Source: Window Capture → Blender
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: disabled

### What to capture

**Scene 1 — before state (0:00 – 0:20)**
Open a new Blender file. In the Scripting workspace, paste and run `blueprint.py`.
Before running, add a `print` + `bm.to_mesh` checkpoint immediately after Step 3
(after the extrude + translate) so the over-dense 68-face slab appears in the
viewport. Switch to Solid view, press Numpad 5 (Orthographic), Numpad 1 (Front).
Orbit slightly (middle-mouse) to show the slab depth. Face count reads in the
bottom-left status bar.

**Scene 2 — dissolve_limit call highlighted (0:20 – 0:40)**
In the Text Editor, highlight the `bmesh.ops.dissolve_limit(...)` block.
Run the script from Step 4 onward. The viewport updates to 6 faces. Zoom in
briefly to the corner to show the clean 90° edge between the flat face and the
side wall.

**Scene 3 — final low-poly GLB export (0:40 – 1:00)**
Open the System Console (Window → Toggle System Console on Windows) to show
the three print outputs:
```
[before]      verts=70  edges=161  faces=68
[after limit] verts=8   edges=12   faces=6
[final]       verts=8   edges=12   faces=6
```
Then switch to the Outliner, highlight `hf_panel_tile`, and orbit once slowly
around the object to show the flat-shaded minimal slab.

### Output file
`public/library/videos/scripting/python-bmesh-ops-dissolve-topology-reduction-degenerate-cleanup-webxr/screen.mp4`
