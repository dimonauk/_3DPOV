# Screen Recording Notes — GN Set Material Index: Voronoi Cell Zones

## Setup

| Setting | Value |
|---|---|
| Software | OBS Studio 30+ or Windows Game Bar (Win+G) |
| Window source | Blender 5.1 window |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary track needed for library entry) |
| Output | `public/library/videos/geometry-nodes/gn-set-material-index-voronoi-cell-zones/screen.mp4` |
| Codec | H.264, CRF 18 (OBS: Quality-based VBR, CQ 18) |

---

## What to Capture

**Duration target: 3–5 minutes.**

### Part 1 — Material Slots Panel (30 s)
1. Open `voronoi_gem.blend` (run `blueprint.py` first if not done).
2. Select `voronoi_gem` in the viewport.
3. Switch to the **Properties panel → Material Properties** (sphere icon).
4. Pan/zoom so all four material slots (gem_ruby, gem_topaz, gem_sapphire,
   gem_obsidian) are visible on-screen.
5. Hover over each slot briefly to show the name.

### Part 2 — Geometry Nodes Editor (90 s)
1. Split the viewport: open a **Geometry Node Editor** pane.
2. Select `voronoi_gem`, click **Edit** on the `HF_MatIdx` modifier.
3. The node tree loads. Slowly pan through:
   - `Group Input` → `ShaderNodeTexVoronoi` → `ShaderNodeSeparateXYZ`
   - → `ShaderNodeMath (MULTIPLY)` → `ShaderNodeMath (FLOOR)`
   - → `FunctionNodeFloatToInt` → `GeometryNodeSetMaterialIndex` → `Group Output`
4. Hover over the **Voronoi Texture** node; show the `Color` socket highlighted.
5. Change `Scale` input from 3.0 → 1.0 in the modifier panel and watch cells
   grow larger in the 3D viewport.  Revert to 3.0.

### Part 3 — Viewport Spin (60 s)
1. Back to the 3D viewport in **Material Preview** mode (Z → Material Preview).
2. Middle-click orbit around the gem so all four cell colours are visible.
3. Press **Numpad 4** / **Numpad 6** repeatedly to spin it back and forth.
4. Point out how each Voronoi cell boundary is a sharp, hard edge — no gradient
   bleeding between colours.

### Part 4 — Modifier Panel Demo (60 s)
1. Open the **Properties → Modifier** panel with HF_MatIdx expanded.
2. Change **Randomness** from 1.0 → 0.3 (cells become more regular, grid-like).
3. Change **Num Slots** from 4 → 2 (only ruby + topaz appear).
4. Revert both values.

---

## OBS Scene Settings

```
Scene: Blender_Tutorial
Sources:
  - Window Capture (Blender 5.1)    [full window]
  - [no webcam needed for library entry]

Output:
  Container: MP4
  Encoder:   x264 (software) or NVENC H.264 (GPU)
  CRF / CQ:  18
  Preset:    veryfast (NVENC) / medium (x264)
  Audio:     disabled
```

---

## Post-processing (Optional)

If trimming in Blender's VSE:
1. Import `screen.mp4` as Movie Strip.
2. Trim heads/tails to remove any pre-roll.
3. Export: `File → Render → Render Animation` with same H.264 settings.

See `/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export` for the
full VSE tutorial production workflow.
