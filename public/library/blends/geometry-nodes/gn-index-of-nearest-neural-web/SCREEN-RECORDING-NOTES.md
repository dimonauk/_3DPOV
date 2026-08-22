# Screen Recording Notes — GN Index of Nearest Neural Web

**Target file:** `public/library/videos/geometry-nodes/gn-index-of-nearest-neural-web/screen.mp4`

## Software

| Tool | Setting |
|---|---|
| OBS Studio ≥ 30 | Window Capture source = Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (mute mic + desktop) |
| Output | MP4 / H.264 / CRF 18 |

## Shot list

1. **Finished result — viewport orbit** (15 s) — open the finished `.blend`,
   set Wave Radius to 1.2 in the GN modifier properties so roughly half the
   connections are active.  Orbit the camera in the viewport to show the web
   from multiple angles.  Switch between Solid and Material Preview to show
   the emission colours.

2. **GN tree overview** (15 s) — open Geometry Nodes editor.  Frame the full
   tree from Group Input through the three `Store Named Attribute` nodes to the
   For Each zone, post-zone, and Group Output.  Pan slowly left-to-right so
   every node label is readable.

3. **Index of Nearest close-up** (20 s) — zoom to the
   `GeometryNodeIndexOfNearest` node.  Hover over its Position input (tooltip
   shows the default InputPosition field) and its Index output.  Then zoom to
   the adjacent `SampleIndex` node to show how the Index output feeds directly
   into the Index input — this is the "read the neighbour's attribute" wiring.

4. **SampleIndex for nn_position** (15 s) — highlight the three wires flowing
   into `SampleIndex`: Geometry (scatter points), Value (Position field),
   Index (from IndexOfNearest).  Use Ctrl+Shift+click (Node Wrangler preview)
   to pin the Spreadsheet to this node — show the `nn_position` column filling
   with vector values.

5. **Gate nodes — wave and distance** (15 s) — zoom to the two
   `FunctionNodeCompare` nodes (wave gate and range gate) plus the Boolean AND.
   Live-drag the Wave Radius group socket value from 0 → 2.5 while watching
   the Spreadsheet `conn_active` column change from False to True per row.

6. **For Each zone interior** (25 s) — zoom into the For Each zone body.
   Trace the path: Element Index → four SampleIndex nodes → Mesh Line
   (END_POINTS) → Store Named Attribute (colour_t on line) → Delete Geometry
   (NOT conn_active selection) → For Each Output.  Pause on the Mesh Line node
   and show the END_POINTS mode property in the node header.

7. **Post-zone: edges to tubes** (15 s) — trace For Each Output →
   Mesh to Curve → Curve to Mesh (with Circle profile, radius from Tube Radius
   group socket).  Live-drag Tube Radius to show tubes thickening.

8. **Spreadsheet — colour_t column** (10 s) — with the scatter point domain
   selected in the Spreadsheet, scroll the `colour_t` column.  Values near 0.0
   are north-pole points (cyan tubes); values near 1.0 are south-pole points
   (magenta tubes).

9. **GLB in browser** (10 s) — drag `neural_web.glb` into `gltf.report` or the
   Three.js editor.  Confirm emission colours and tube geometry survived the
   Draco export.

## OBS scene setup

```
Sources:
  [Window Capture]  Name: "Blender"   Window: Blender
  [Audio Output]    Muted
Filters on Blender capture:
  Crop/Pad: none (full 1920 × 1080)
  Colour Correction: none
```

## Recording checklist

- [ ] Blender UI theme: Dark (default)
- [ ] Viewport overlay: Statistics OFF, Annotations OFF
- [ ] Geometry Nodes editor open in lower split, Spreadsheet in side panel
- [ ] Node Wrangler enabled (Ctrl+Shift+click preview active)
- [ ] Wave Radius set to 1.2 at start of take (half-active state)
- [ ] OBS output format set to MP4 before starting
- [ ] Test 10-second clip before full take
