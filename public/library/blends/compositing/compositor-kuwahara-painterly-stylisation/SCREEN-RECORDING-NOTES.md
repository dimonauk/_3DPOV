# Screen-Recording Notes — Kuwahara Painterly Stylisation

Target file: `public/library/videos/compositing/compositor-kuwahara-painterly-stylisation/screen.mp4`

## Software

**OBS Studio** (recommended) or Windows Game Bar (`Win + G`).

## Setup

| Setting | Value |
|---|---|
| Window source | Blender (full window, not display capture) |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | Off — no commentary track needed |
| Output format | MP4 / H.264 |

## What to capture (approx. 5–8 minutes)

1. **Open Blender** → File → Open `kuwahara_painterly.blend`
   (or run `blueprint.py` from Text Editor and save).

2. **Show the 3D Viewport** — orbit slowly around the faceted vessel.
   Point out: the 12-sided cylinder, emissive trim ring, three-point lighting.

3. **Switch to Compositor workspace** — show the full node tree:
   `RenderLayers → Denoise → Kuwahara → Mix → Grain → Tonemap → Composite`.

4. **Select the Kuwahara node** — show N-panel properties:
   - Size, Uniformity, Sharpness sliders
   - Variation dropdown (Anisotropic vs Classic)

5. **F12 to render** (Cycles, 96 samples with adaptive sampling).
   While rendering, explain the OIDN pass setup (Normal + DiffCol enabled).

6. **After render complete** — click the Viewer node to see the composited result.
   Toggle between Viewer wired directly to Denoise output vs Kuwahara output.

7. **Live parameter demo** — with Viewer active:
   - Change `kuw.size` from 2 → 8 (re-render each time or use Shift+Ctrl+F12).
   - Toggle `variation` from ANISOTROPIC → CLASSIC — show the blocky artefacts
     at edges in CLASSIC vs the contour-following strokes in ANISOTROPIC.

8. **Mix node demo** — set Fac from 0.0 (clean) to 1.0 (full Kuwahara) to show
   the transition from photo-real to oil-paint.

9. **Save** the .blend: Ctrl+S → `kuwahara_painterly.blend`.

## Tips

- In the Compositor workspace, press **N** to open the Node editor sidebar
  to show Kuwahara node properties more clearly.
- Zoom in on the torus trim ring in the Viewer — the Kuwahara strokes
  wrapping the cylinder are most visible there.
- If Cycles render is slow, reduce `RENDER_SAMPLES` to 32 and show the
  OIDN denoising step compensating.
