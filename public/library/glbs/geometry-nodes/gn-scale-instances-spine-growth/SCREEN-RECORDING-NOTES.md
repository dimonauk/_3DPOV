# Screen Recording Notes — GN Scale Instances Spine Growth

**Target file:** `public/library/videos/geometry-nodes/gn-scale-instances-spine-growth/screen.mp4`

## Software

| Tool | Setting |
|---|---|
| OBS Studio ≥ 30 | Window Capture source = Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (mute mic + desktop) |
| Output | MP4 / H.264 / CRF 18 |

## Shot list

1. **Finished result — grow reveal** (15 s) — open `spine_growth.blend`.
   In the GN modifier properties panel, live-drag `Grow Factor` from 0 to 1
   while watching all spines extend simultaneously. Rotate the viewport to show
   the polar compression (shorter spines near both poles).

2. **GN tree overview** (15 s) — open the Geometry Nodes editor. Frame the
   full tree from Group Input through Noise, MapRange (two instances), math
   chain, CombineXYZ, all the way to Scale Instances and Realize Instances.
   Pan slowly left-to-right so every node label is readable.

3. **Scale Instances node close-up** (20 s) — zoom in on `Scale Instances`.
   Show the four inputs: Instances (from Instance On Points), Scale (the
   Vector from CombineXYZ), Center (0,0,0), and Local Space (True). Toggle
   Local Space to False and drag Grow Factor — explain why spines now shear
   as the sphere rotates. Toggle back to True.

4. **Noise + MapRange: patch variation** (15 s) — zoom to the Noise Texture
   and adjacent MapRange nodes. Use Ctrl+Shift+click (Node Wrangler) to
   preview the noise Fac output — a grey cloud over the sphere surface.
   Then preview the MapRange output — the same cloud remapped to
   [0.18, 1.0] spine scale values.

5. **Latitude compression math** (15 s) — zoom to the SeparateXYZ → Absolute
   → lat MapRange chain. Preview the Absolute node output — a white-to-black
   gradient from poles to equator. Preview the lat MapRange — the same
   gradient remapped to [1.0, 0.42] showing how polar vertices will get
   shorter spines.

6. **Spreadsheet: per-instance scale** (15 s) — open the Spreadsheet editor.
   Set domain to INSTANCE. Pin it to the Scale Instances node. You should
   see a Scale column with distinct (1, 1, Z) vectors per row — no two rows
   identical. Drag Grow Factor to 0 — all Z values should collapse to ~0.

7. **Polar cap comparison** (10 s) — orbit the viewport camera directly over
   the north pole. Show the compact, flat-lying spines vs rotating to the
   equatorial band where spines are longest. Point out the smooth gradient —
   no hard boundary between zones.

8. **GLB in browser** (10 s) — drag `spine_growth.glb` into `gltf.report`.
   Confirm the material loaded, the cone geometry is correct, and Draco
   decompression happened cleanly.

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
- [ ] Geometry Nodes editor open in lower split, Properties on right
- [ ] Spreadsheet editor available in a third panel
- [ ] Node Wrangler enabled (Ctrl+Shift+click preview active)
- [ ] Grow Factor set to 1.0 at start of take so result is visible
- [ ] OBS output format set to MP4 before starting
- [ ] Test 10-second clip before full take
