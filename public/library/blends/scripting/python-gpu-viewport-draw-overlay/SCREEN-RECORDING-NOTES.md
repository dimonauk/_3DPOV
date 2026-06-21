# Screen Recording Notes
## Python — gpu Module: Custom Viewport Overlay
### Blender 5.1 · OBS Studio / Windows Game Bar

---

## Goal

Capture `screen.mp4`: you working through `blueprint.py` in the Scripting
workspace, then mousing around the 3D Viewport to show the coloured normal
arrows updating live.

---

## Setup

| Setting | Value |
|---|---|
| Software | OBS Studio 30+ or Windows Game Bar (Win + G) |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (tutorial is text/visual only) |
| Output | MP4 · H.264 · CRF 22 |
| File name | `screen.mp4` |
| Output folder | `public/library/videos/scripting/python-gpu-viewport-draw-overlay/` |

---

## OBS Setup Steps

1. Open OBS → **+** under Sources → **Window Capture**.
2. Select **[blender.exe] Blender**.
3. Set Output Resolution to **1920×1080** (Scale/Filter: Lanczos).
4. Output → Settings → Recording Path: `…/public/library/videos/scripting/python-gpu-viewport-draw-overlay/`.
5. Recording Format: **MP4**, Encoder: **x264**, CRF **22**.

---

## What to Record

### Part 1 — Show the empty Scripting workspace (30 s)
- Blender open, Scripting layout active.
- 3D Viewport visible on the left (~60 % width), Text Editor on the right.
- Default cube is selected.
- No overlays active yet — the viewport is clean.

### Part 2 — Open / paste blueprint.py (60 s)
- Click **New** in the Text Editor.
- Paste (or type) the key sections of `blueprint.py`:
  - The `_build_batch` function — point out the `inv_t` line.
  - The `_draw_normals` callback — point out `POST_VIEW`.
  - The `register_overlay()` call at the bottom.
- It is fine to use Ctrl+V to paste the whole file — the viewer understands.

### Part 3 — Run the script (15 s)
- Press **Alt+P** (or click **Run Script** in the Text Editor header).
- The 3D Viewport immediately shows blue-to-red arrows over the cube's faces.
- Pause here; let the arrows be visible for ≥ 3 seconds.

### Part 4 — Switch object and move around (90 s)
- Press **Shift+A → Mesh → Monkey** to add Suzanne.
- Click Suzanne to make it active.
- The arrows update to Suzanne's denser face topology.
- Orbit the viewport (middle mouse drag) — arrows stay attached to faces.
- Select the default Cube — arrows switch back to the cube.
- In **Edit Mode (Tab)**, rotate a face (R, Z, 45, Enter) — switch back to
  Object Mode, arrows reflect the new normal direction.

### Part 5 — Unregister (15 s)
- In the Text Editor Python Console (or a new text block) type and run:
  ```python
  unregister_overlay()
  ```
- The arrows vanish immediately.
- This shows the clean handle-based teardown.

### Part 6 — Closing shot (10 s)
- Return to the Scripting workspace with `blueprint.py` visible.
- Viewport shows a clean Suzanne.
- Stop recording.

---

## Post-Processing

- Trim any dead time at start/end.
- No colour grade required — Blender's UI is the subject.
- Target duration: **3–4 minutes**.
- Export as MP4 H.264 CRF 22, save as `screen.mp4` in the output folder.

---

## Checklist

- [ ] OBS window capture targets the Blender window (not display capture).
- [ ] 1920×1080 confirmed in OBS output settings.
- [ ] Audio track is disabled.
- [ ] Recording path is correct.
- [ ] `blueprint.py` is visible in the Text Editor during Part 2.
- [ ] Arrows are clearly visible in Parts 3–5.
- [ ] `unregister_overlay()` teardown is captured.
- [ ] Output file named `screen.mp4` in the correct folder.
