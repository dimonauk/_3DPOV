# Screen Recording Notes — Viewport Compositor: Glare, Vignette & Colour Grade

Target file: `public/library/videos/compositing/viewport-compositor-realtime-glare-vignette-colour-grade/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source  | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent tutorial) |
| Output | MP4 / H.264 CRF 18 |

## What to capture

1. **Open blend** — file with the vp_comp_demo scene already built by blueprint.py.
2. **Switch viewport shading to RENDERED** — click the sphere icon in the 3D viewport header, select RENDERED.  EEVEE fires up; bloom and grade should appear immediately if `use_compositor = 'ALWAYS'` is set.
3. **Show node tree** — split the viewport, open Compositor editor in one half.  Pan so the Glare → Colour Balance → Lens Distortion chain is visible.
4. **Demonstrate live editing** — with recording active:
   - Drag the Glare **Threshold** slider from 1.2 down to 0.5; show the bloom expanding in real time.
   - Adjust **Colour Balance** Gain blue channel up; show the highlights cool.
   - Increase **Vignette Blend** factor; show corners darken.
5. **Play animation** — press Space to play the keyframed orb pulse (frames 1–120); show the bloom growing and receding.
6. **Compare modes** — briefly switch `use_compositor` from `ALWAYS` to `DISABLED`; show the ungraded raw EEVEE output, then switch back.

## Edit notes

Trim dead air at start/end.  No music needed.  Keep total length 60–90 seconds.
Add chapter markers at: Enabling (0:05), Glare live edit (0:20), Colour grade (0:40), Animation playback (1:00).
