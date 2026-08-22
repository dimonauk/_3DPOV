# Screen Recording Notes — OIDN Denoise Compositor

**Target file**: `public/library/videos/compositing/compositor-oidn-denoise-cycles-passes/screen.mp4`

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled |
| Encoder | x264, CRF 18 |

## What to record

1. **Script run** — Open the Text Editor, show `blueprint.py` is loaded, press
   Alt+P.  Let the script complete; show the 3D Viewport — the sandstone sphere
   with the displacement ridges should be visible.

2. **Compositor workspace** — Switch to Compositing.  Show the three nodes:
   RenderLayers → Denoise → Composite.  Pan to highlight that the Denoise node
   has three inputs wired: Image, Normal, Albedo (DiffCol).

3. **View Layer passes** — Cut to Properties → View Layer → Passes → Data.
   Show Normal and Diffuse › Color are both ticked alongside the default Combined.

4. **Raw render** — Mute the Denoise node (M with cursor over it).  Press F12.
   Let the render complete.  Pause on the UV/Image Editor showing the grainy
   result — the sandy surface should be visibly speckled.

5. **Denoised render** — Unmute the Denoise node (M again).  Press F12.
   Let the render complete.  Pause to show the clean result.  Slowly pan the
   mouse between the two renders in the Image Editor to emphasise the difference.

6. **Prefilter comparison** — In the Properties panel of the Denoise node, change
   Prefilter from ACCURATE → NONE.  Re-render.  Show the difference in edge
   sharpness on the sphere silhouette.  Return to ACCURATE.

7. **Samples slider** — Change `RENDER_SAMPLES` from 32 to 8 in the script, re-run
   Alt+P, render.  Show that at 8 spp the denoiser still produces a usable result.

## Duration

Aim for 2–4 minutes total, uncut.  Compress with Handbrake H.264 CRF 20 for
delivery.  No commentary needed — the title card `compositor-oidn-denoise-cycles-passes`
displayed briefly at the start is sufficient identification.
