# Screen-Recording Notes — Vector Displacement Map Tutorial
Blender 5.1 | Holoflow Studio

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (not full desktop) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output | `screen.mp4` (H.264, CRF 18) |
| Audio | Off (tutorial narration added in post) |

## Session Order

### 1 — Open a fresh Blender 5.1 file (00:00 – 00:30)
- File › New › General.
- Render Properties › Render Engine: **Cycles**.
- Render Properties › Feature Set: **Experimental** (unlocks Adaptive Subdivision).
- Show this change on screen — it is easy to miss and causes the most common
  failure ("Adaptive Subdivision option greyed out").

### 2 — Model the base panel (00:30 – 02:30)
- Add › Mesh › Grid (8 × 5 cuts). Scale X: 0.32, Y: 0.22.
- Bevel outer boundary edges: Edge select → Select Boundary Loop → Bevel
  (Ctrl+B, 0.006 m, 2 segments, Profile 0.7).
- Smart UV unwrap (Edit Mode, A to select all, UV › Smart UV Project,
  66° angle limit, 0.02 island margin). Show the UV editor side-by-side.

### 3 — Build the high-poly source (02:30 – 05:00)
- Duplicate the panel (Shift+D, Enter).
- Rename: `vdm_armour_panel_hi`.
- Add Subdivision Surface modifier, 4 levels, apply.
- Add Displacement modifier: New Texture (Clouds, Scale 0.08),
  Strength 0.015, Mid Level 0.5. **Do not apply** — show the live deformation.
- Highlight that this simulates multires sculpting; in production you would
  sculpt interactively instead.

### 4 — Set up the bake image (05:00 – 06:30)
- Open Image Editor panel.
- New Image: 1024 × 1024, 32-bit Float, **uncheck** Alpha.
- Image › Image Settings: Format **OpenEXR**, Colour Depth **32-bit Float**.
- In the Shader Editor for the base panel: add Image Texture node, assign
  the new image. Emphasise: **set it as the active node** (click to select —
  orange outline confirms it).
- Colorspace on the node: **Non-Color** (data, not colour).

### 5 — Bake (06:30 – 08:30)
- Render Properties › Bake panel:
  - Bake Type: **Displacement**.
  - Selected to Active: **on**.
  - Extrusion: **0.0165** (= DISPLACE_AMP × 1.1 = 0.015 × 1.1).
  - Margin: 8 px.
- Select the high-poly, Shift-click the base panel (active).
- **Bake**.  Show the progress bar.
- After bake: Image Editor shows a grey EXR.  Zoom in — fine noise detail
  is visible as subtle value variation.
- Image › Save As → choose `.exr` filename.

### 6 — Wire the VDM shader (08:30 – 10:30)
- In Shader Editor for the base panel:
  - Add Vector Displacement node (Shift+A › Vector › Vector Displacement).
  - Space: **Tangent**.
  - Midlevel: 0.0 (bake is already zero-centred).
  - Scale: 1.0.
  - Image Texture Color → Vector Displacement Vector.
  - Vector Displacement Displacement → Material Output Displacement.
- Add Adaptive Subdivision modifier: Subdivision Surface ›
  enable **Adaptive Subdivision** checkbox.  Levels: 2.
- Show Cycles dicing rate slider (Scene Properties › Simplify › Cycles,
  or Object Properties › Adaptive Subdivision for per-object override).

### 7 — Render comparison (10:30 – 13:00)
- F12 in Cycles Experimental.  Show displaced silhouette at panel edge.
- Side-by-side: render without VDM (base mesh only) vs with VDM.
- Change dicing rate from 4.0 → 1.0; show geometry density difference.
- Material Settings › Surface › Displacement: switch **Bump Only** — silhouette
  collapses to flat panel.  Switch back to **Displacement** — silhouette returns.

### 8 — Export strategy (13:00 – 14:30)
- Show: File › Export › glTF 2.0 of the panel *with* VDM active.
  Three.js / WebXR viewer: no displacement visible — flat panel.
- Show: switch to Bump Only, disable Adaptive Subdivision, export again.
  Viewer shows flat shading — no normal map included.
- Explain the two-pass strategy:
  1. Keep the VDM + Cycles rig for studio renders.
  2. Bake a normal map from the displaced Cycles render (see batch-bake
     tutorial).  Export that normal map in the GLB.

## Common Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Adaptive Subdivision option greyed out | Feature Set is not Experimental | Render Props › Feature Set › Experimental |
| Bake result is pure black | Image node not set as active | Click the image node in Shader Editor |
| Displaced geometry noisy/wrong | Image colorspace not Non-Color | Set colorspace to Non-Color on image node |
| EXR looks like noise, no detail | Cage extrusion too small | Increase to 110% of max displacement amp |
| Render crashes / infinite loop | Dicing rate too low on dense mesh | Set dicing_rate ≥ 0.5; start at 2.0 |
| GLB looks flat despite VDM | glTF exporter ignores Displacement socket | Expected — use normal map for GLB delivery |
