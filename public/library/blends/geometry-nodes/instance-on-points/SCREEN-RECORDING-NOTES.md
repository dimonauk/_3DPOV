# Screen Recording Notes — GN Instance on Points

OBS or Windows Game Bar instructions for capturing `screen.mp4`.

---

## Target file

`public/library/videos/geometry-nodes/instance-on-points/screen.mp4`

---

## Blender layout before you hit Record

1. **Workspaces**: split the screen between the **Geometry Node Editor**
   (top 60%) and the **3D Viewport** (bottom 40%).  Use Material Preview
   shading in the viewport (Z → 4) so the instanced tiles show their
   material colour.
2. **Run `blueprint.py`** first so the scene is live.  The viewport
   should show a grid of scattered blue diamond tiles.
3. In the **GN Editor**, pin the modifier's node group so the graph is
   visible: select the ScatterSurface object, open the GN modifier in
   Properties > Modifier, click the node-group name to open it in the GN
   editor.
4. **Viewport overlay**: turn on Wireframe overlay (Alt+Z) just for the
   ScatterSurface base mesh so you can see the scatter surface separately
   from the instances.

---

## OBS settings

| Setting    | Value                                                        |
|------------|--------------------------------------------------------------|
| Source     | Window capture → Blender                                     |
| Resolution | 1920 × 1080                                                  |
| FPS        | 30                                                           |
| Format     | MP4 / H.264                                                  |
| Audio      | Off                                                          |
| Output     | …/videos/geometry-nodes/instance-on-points/screen.mp4        |

---

## What to record (approximately 2 minutes)

### Section 1 — Result first (~20 s)
Viewport showing the scattered tile panel.  Orbit slowly around it to
show the tile depth.  The panel should be clearly visible as hundreds of
individual diamond tiles scattered across a flat grid.

### Section 2 — The GN graph (~40 s)
Focus on the Geometry Node Editor.  Trace the data flow from left to
right with the mouse:
- Group Input → Distribute Points on Faces (hover over Density Max input)
- Points output → Instance on Points (hover over Instance input, then
  note the Object Info node feeding it)
- Instances output → Rotate Instances → Realize Instances → Group Output

Point to the `Realize Instances` node and hold for 3 seconds — this is
the key step that collapses instances for GLB export.

### Section 3 — Live parameter editing (~25 s)
In the modifier panel (Properties > Modifier > ScatterGN):
- Change Density Max from 6 to 2 — tiles thin out.
- Change Density Max to 12 — tiles pack tightly.
- Change Seed from 42 to 7 — tiles redistribute.
Viewport updates live each time.

### Section 4 — Swap the tile (~20 s)
In the Object Info node, click the Object picker and change it to a
different object in the scene (add a UV sphere first if needed).  The
entire scatter updates to use the new instance geometry.  This is the
payoff of the procedural approach vs Tissue's static re-tessellate.

### Section 5 — Export (~15 s)
File > Export > glTF 2.0.  Point at the 'Apply Modifiers' checkbox.
Note that without it, the exported GLB would be an empty surface — the
instances only exist in the modifier stack.

---

## Post-processing

Trim dead frames at start and end.  No colour grade required.
