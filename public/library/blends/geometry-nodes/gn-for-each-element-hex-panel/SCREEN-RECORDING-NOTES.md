# Screen Recording Notes — GN For Each Geometry Element Hex Panel

**Target file:** `public/library/videos/geometry-nodes/gn-for-each-element-hex-panel/screen.mp4`

## Software

| Tool | Setting |
|---|---|
| OBS Studio ≥ 30 | Window Capture source = Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (mute mic + desktop) |
| Output | MP4 / H.264 / CRF 18 |

## Shot list

1. **Scene overview** (15 s) — orbit around the finished hex panel in Solid view;
   show all cells at varying heights and colours.
2. **GN tree — outer view** (20 s) — open the Geometry Nodes editor; frame the
   entire tree so the For Each Input and For Each Output nodes are visible as
   a zone boundary. Zoom slowly left to right so the viewer can read node labels.
3. **For Each Input node close-up** (10 s) — zoom to the `GeometryNodeForeachGeometryElementInput`
   node. Highlight the `Domain = FACE` property in the node header.
4. **Inside zone — isolate face** (20 s) — trace the wire from Element Index →
   Compare Integer (EQUAL) → Index field → Separate Geometry. Narrate that
   this is the per-iteration face mask.
5. **Inside zone — random extrude** (20 s) — trace Element Index → Random Value
   (Seed) → Extrude Mesh (Offset Scale). Wiggle the Extrude Max group socket
   live and show cells reacting.
6. **For Each Output node** (10 s) — show the accumulation wiring from
   Store Named Attribute into the zone output geometry socket.
7. **Spreadsheet — cell_colour** (15 s) — switch to Spreadsheet, set domain to
   FACE. Scroll through the `cell_colour` FLOAT4 column showing each hex's
   unique RGBA. This makes the per-element isolation visible as raw data.
8. **GLB in browser** (10 s) — drag the exported `hex_panel.glb` into
   `gltf.report` or Three.js editor; confirm colours and extrusion survived export.

## OBS scene setup

```
Sources:
  [Window Capture]  Name: "Blender"   Window: Blender
  [Audio Output]    Muted
Filters on Blender capture:
  Crop/Pad: none (full 1920×1080)
  Colour Correction: none
```

## Recording checklist

- [ ] Blender UI theme: Dark (default)
- [ ] Viewport overlay: Statistics OFF, Annotations OFF
- [ ] Geometry Nodes editor open in lower split
- [ ] Node wrangler enabled (highlight-on-hover active)
- [ ] OBS output format set to MP4 before starting
- [ ] Test 10-second clip before full take
