# Screen Recording Notes — GN Separate Geometry Exploded View

## Target file
`public/library/videos/geometry-nodes/gn-separate-geometry-exploded-view/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (or system mute) |
| Output format | MP4 / H.264 |

## What to record (approx. 3–5 minutes)

1. **Open blueprint.py** in the Scripting workspace. Briefly show the file — scroll through the SeparateGeometry and BoundingBox sections.
2. **Run the script.** Switch to Layout workspace; show the UVSphere with the GN modifier active.
3. **Scrub the timeline** from frame 1 → 60 in the Layout workspace (drag the green scrubber). The upper hemisphere should lift cleanly away; the amber/teal colour split is clearly visible.
4. **Switch to the GN editor.** Click the GN modifier (wrench icon → Nodes) to open the node tree. Walk through the graph left-to-right:
   - InputPosition → SeparateXYZ → Compare
   - SeparateGeometry (point out the TWO output sockets: "Selection" and "Inverted")
   - SetMaterial on each half
   - BoundingBox → SeparateXYZ → Multiply (Explode_Gap) → CombineXYZ
   - TransformGeometry → JoinGeometry
5. **Inspector moment**: open the Spreadsheet editor, set domain to **Face**, Ctrl+Shift+click the SeparateGeometry node. Show the Selection column — 1 (True) for upper faces, 0 (False) for lower.
6. **Test Explode_Gap interactively**: in the GN modifier properties, drag the Explode_Gap slider from 0 → 1 → 0. Confirm the animation is reversible (no permanent deletion).
7. **Run record.py** in the Scripting workspace. Show the terminal output confirming the .mp4 path.

## Common issues

- **Both halves same colour**: SeparateGeometry output sockets may be swapped — check which socket goes to which SetMaterial node.
- **Gap too large or too small**: BoundingBox is reading the wrong geometry — confirm the wire from SeparateGeometry.outputs["Selection"] connects to BoundingBox.inputs["Geometry"], not JoinGeometry or the full sphere.
- **Sphere not split at equator**: SPLIT_Z constant at top of blueprint.py; adjust if the cut appears off-centre.
