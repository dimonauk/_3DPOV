# Screen Recording Notes — GN Extrude Mesh Panel Lines

**Target file:** `public/library/videos/geometry-nodes/gn-extrude-mesh-panel-lines/screen.mp4`

## OBS / Game Bar setup

- Source: Window Capture → Blender
- Resolution: 1920×1080
- Frame rate: 30 fps
- Audio: off
- Output: MP4 / H.264 / CRF 23

## Shot list (approx. 3 minutes total)

### Shot 1 — Base mesh (0:00–0:30)
Open `panel_lines.blend`. In the 3D Viewport, show the flat 4×4 grid with
no GN modifier yet. Toggle Object Properties → Geometry Data → Attributes to
show the `panel_face` boolean attribute already set on the mesh. This
establishes that the face selection lives in the data, not in a node.

### Shot 2 — GN Editor overview (0:30–1:00)
Switch to the Geometry Node Editor workspace. Walk through the node graph
left to right: Group Input → Named Attribute → Extrude Mesh → Scale
Elements → Set Shade Smooth → Group Output. Hover over the `Top` wire
between Extrude Mesh and Scale Elements — the tooltip showing `BOOLEAN`
confirms this is a face mask, not geometry.

### Shot 3 — Panel Depth slider live (1:00–1:45)
Return to the 3D Viewport. In the modifier panel, grab the Panel Depth
slider and drag from 0.0 to -0.08 slowly. The panels should visibly sink
into the wall in real time. Drag back to -0.04. This is the key live-
parameter demonstration that the tutorial is built around.

### Shot 4 — Panel Inset slider (1:45–2:15)
Drag the Panel Inset slider from 1.0 down to 0.75. The panel bottoms
shrink toward their centres, revealing the chamfered ledge. Return to 0.82.

### Shot 5 — GLB inspect (2:15–3:00)
Open a browser tab to `gltf.report` or `sandbox.babylonjs.com`.
Drop in `output/panel_lines.glb`. Rotate the model to show the
recess depth and chamfer from a 45° angle. The mesh tab should show
~192 faces (16 base + 8×8 extrusion sides + 8 chamfered tops).

## Editing notes

Cut shots together with 0.5 s dissolves. No narration needed — captions
can be added in post using the tutorial step titles as chapter markers.
Aim for the final encode under 40 MB.
