# Screen Recording Notes — Menger Sponge Poi Head

These notes are for capturing `screen.mp4` via OBS or Game Bar.

## OBS settings

| Setting | Value |
|---|---|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to capture (suggested order)

1. **Script editor** — show `blueprint.py` scrolling through the code.
   Pause on the `is_menger` vectorised block to explain the base-3 digit test.
2. **Run the script** — show the 3D viewport as the sponge appears.
3. **Viewport inspection** — orbit around the sponge; zoom into a tunnel to
   show the three-level recursive holes.
4. **Vertex colour mode** — switch the viewport to `Vertex Paint` shading.
   The three axes (red / green / blue) should be clearly visible.
5. **Shape key** — in the Properties panel → Object Data → Shape Keys,
   drag SK_Exploded from 0 to 1.  Record the cubes separating.
6. **GLB export** — briefly show the exported GLB path in the file browser.

## Typical duration

6–10 minutes.  You may trim to a highlight reel of 90 seconds for social.

## Output path

```
public/library/videos/scripting/
  python-numpy-menger-sponge-level3-hausdorff-fractal-void-cage-poi-webxr/
    screen.mp4
```
