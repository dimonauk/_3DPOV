# Screen Recording Notes — Lantern Assembly (Join + Transform)

**Target file:** `public/library/videos/geometry-nodes/gn-join-geometry-transform-multi-part-assembly-lantern-webxr/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (tutorial narration added in post) |
| Output format | MP4 (H.264, CRF 18) |

## Shot List

### Shot 1 — Overview (0:00 – 0:15)
Open the Scripting workspace with `blueprint.py` loaded. Press **Run Script**.
Pan the 3D Viewport so the assembled lantern is centred at mid-frame.
Camera angle: 3/4 front, eye level with the gem.

### Shot 2 — Node tree walkthrough (0:15 – 1:00)
Switch to the **Geometry Nodes** workspace.
Slowly scroll the node tree left-to-right:
- Start at Group Input (show Gem Radius + Cage Thickness sockets)
- Pan to IcoSphere nodes for gem and cage (side by side)
- Pan to Wireframe node (highlight Thickness input linked to group socket)
- Pan to Cylinder node (highlight Vertices = 6)
- Pan to Transform Geometry nodes (hover each, show Translation values in N-panel)
- Pan to SetMaterialIndex nodes (show index values 0, 1, 2)
- Pan to JoinGeometry (show three incoming geometry links)

### Shot 3 — Live parameter tweak (1:00 – 1:30)
Click on the **hf_lantern** object in Outliner → open the modifier panel.
Drag **Gem Radius** slider from 0.22 → 0.38 and back.
Drag **Cage Thickness** from 0.012 → 0.032 and back.
The viewport should update live — this demonstrates why exposing sockets as
group inputs is preferable to hardcoding node defaults.

### Shot 4 — Material slots (1:30 – 1:45)
In the Properties panel, open the Material Properties tab.
Click through slot 0 (Lantern_Gem), slot 1 (Lantern_Cage), slot 2 (Lantern_Base).
Briefly show that SetMaterialIndex reads this slot list by index.

### Shot 5 — Attribute domain inspection (1:45 – 2:15)
Add a **Spreadsheet Editor** panel (drag a corner of the viewport).
With hf_lantern selected, set the Spreadsheet to **Face** domain and
**Evaluated** data. Scroll to the `material_index` column — show values
0, 1, 2 for each part's faces. This confirms Join Geometry preserves the
attribute correctly across the three streams.

### Shot 6 — GLB export (2:15 – 2:40)
Open the Scripting workspace, run the export block at the bottom of blueprint.py
(or call it from the terminal):
```
blender --background hf_lantern.blend --python blueprint.py
```
Show the resulting `hf_lantern.glb` in the file browser (File → External Data
menu or the OS file manager). File size should be < 40 KB with Draco level 6.

### Shot 7 — rotate.py playback (2:40 – 3:00)
Open `record.py` in the Text Editor, run it.
Watch the rendered viewport animation play back (or scrub the timeline).

## Post-production

- Trim to ≤ 3 minutes.
- Add chapter markers at each shot boundary.
- Narration track: explain each node decision in the Princess register (calm, precise, no filler words).
- Colour grade: neutral, no saturation boost — the lantern's pale-blue gem should read true.
