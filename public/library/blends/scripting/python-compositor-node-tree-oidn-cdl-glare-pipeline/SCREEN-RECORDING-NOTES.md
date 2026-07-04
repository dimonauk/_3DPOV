# Screen Recording Notes — Python CompositorNodeTree Pipeline

**Target file**: `public/library/videos/scripting/python-compositor-node-tree-oidn-cdl-glare-pipeline/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 / NVENC H.264 |
| Output | MKV during capture → remux to MP4 |
| Audio | **Off** (mic + system muted) |

## What to Record

**Total target**: 10–14 minutes screen time.

### Part 1 — Run the script and inspect the blend (2 min)
- Open a terminal, run: `blender --background --python blueprint.py`
- Open `oidn_cdl_glare.blend` in Blender 5.1
- Switch to the **Compositing** workspace (top-bar tab)
- Show the full node tree: Render Layers → Denoise → Color Balance →
  Glare → Composite + Viewer + FileOutput

### Part 2 — Tour the Render Layers node (2 min)
- Click the Render Layers node to select
- In the N-panel (N key), show the `Layer` field — "ViewLayer"
- Go to the Render Properties → View Layer → Passes → Denoising
- Show `Denoising Data` tick — explain: this is `vl.cycles.denoising_store_passes`
- Show `Use Denoising` is **unchecked** — manual compositor control
- In the node editor, hover over the `Denoising Normal` and `Denoising Albedo`
  output sockets to show they exist (they only appear when store_passes is on)

### Part 3 — Tour the Denoise node (2 min)
- Click `CompositorNodeDenoise`
- Show the three input sockets: `Image`, `Normal`, `Albedo` — explain guided vs
  un-guided (Normal + Albedo constrain the filter; without them colour bleeds
  across depth discontinuities)
- Show `HDR` toggle — enabled; explain why (scene-linear emission would clip)
- Show `Prefilter` dropdown → ACCURATE
- Temporarily disconnect Normal and Albedo, do a quick render (F12) to show
  the un-guided result (muddier edges at gem rim), then reconnect

### Part 4 — Tour the Color Balance node (2 min)
- Click `CompositorNodeColorBalance`
- Show `Correction` dropdown → `ASC CDL`
- Show the Slope, Offset, Power sliders for each channel (R/G/B)
- Explain ASC-CDL formula: `out = clamp(in × Slope + Offset) ^ (1/Power)`
- Change CDL_SLOPE R from 1.04 → 0.80 live in the UI to demonstrate a
  colour shift (cool result), then revert to warm values
- Note the difference from Lift/Gamma/Gain: CDL is the exchange format,
  not the same math

### Part 5 — Tour the Glare node (2 min)
- Click `CompositorNodeGlare`
- Show `Glare Type` → STREAKS; `Threshold` → 0.85; `Streaks` → 4
- Do a test render (F12) with threshold 0.85 — gem streaks visible
- Change threshold to 2.5 — streaks disappear (gem emission = 2.8, near miss)
- Change threshold back to 0.85
- Show `Mix` slider: drag from 0 to +1 (pure glare, no image) then back to 0
- Explain: scene-linear threshold = in HDR scene, not display values

### Part 6 — Live render + compositor result (2 min)
- Press F12 to do a full Cycles render
- Once done, the Compositing workspace updates with the final composite
- Toggle the `Use Nodes` checkbox on/off (Render Properties → Post Processing)
  to show before/after: raw combined pass vs the full pipeline output
- Open the Image Editor, switch to `Viewer Node` to see the final graded frame
- Show the FileOutput EXR in the file browser (//oidn_cdl_glare_render0001.exr)

## Post-production
- Trim start/end handles
- Speed ramp: 1.5× on the node-tour sections (> 4 min of touring)
- No music, no voiceover (silent tutorial format)
- Export H.264 MP4, 1920 × 1080, CRF 20
