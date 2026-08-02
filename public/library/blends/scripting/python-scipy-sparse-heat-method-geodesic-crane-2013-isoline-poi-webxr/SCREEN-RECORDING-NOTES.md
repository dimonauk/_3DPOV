# Screen Recording Notes — Geodesic Heat Method

**Target file:** `public/library/videos/scripting/python-scipy-sparse-heat-method-geodesic-crane-2013-isoline-poi-webxr/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## What to record (approx. 4–6 minutes)

1. **Open fresh Blender 5.1** — show empty scene (0:00)
2. **Scripting workspace** — open `blueprint.py` in the text editor (0:20)
3. **Scroll through key sections** while narrating:
   - Cotangent Laplacian assembly loop (explain `cot α = dot/cross`)
   - `(M - t·L) u = δₛ` heat solve comment
   - Gradient normalisation `X = -grad_u / mag`
   - Divergence accumulation loop
   - Poisson solve + shift
4. **Run script** — watch the isoline sphere appear (pause here, orbit) (2:00)
5. **Switch to Solid shading** with vertex colour paint — orbit slowly (2:30)
6. **Open record.py**, run it — let render complete (3:00)
7. **Play back rendered viewport.mp4** in the VSE (if time allows) (4:30)

## Post-production tip

Trim to the moment the sphere materialises with isolines. That single frame
makes the best thumbnail — plasma rings on a black background.
