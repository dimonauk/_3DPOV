# Screen-Recording Notes — Sprott K Attractor

Target file: `public/library/videos/scripting/<slug>/screen.mp4`

## Software

- **OBS Studio** (recommended) or Windows Game Bar (`Win + G`)
- **Blender 5.1**

## OBS Setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | `Blender` |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic needed) |
| Output format | MP4 / H.264 |
| CRF / quality | 18–22 |

## What to Record

1. **Open** `hf_sprott_k_poi.blend` in Blender 5.1.
2. **Scripting workspace** — show the `blueprint.py` source in the Text Editor briefly (5 s).
3. **Run script** — hit *Run Script*; let the geometry build (≈ 20–60 s depending on machine).
4. **Switch to Layout** — tumble the viewport to show the cobalt-to-amber tube from several angles (15 s).
5. **Shape-key sweep** — in the Properties panel → Object Data → Shape Keys, scrub from Basis through SK_LoA, SK_HiA, SK_NearP (30 s).
6. **Material preview** — switch to Material Preview mode; orbit slowly to show the emission glow (10 s).
7. **Scripting detail** — zoom into the Shilnikov eigenvalue comment block in `blueprint.py` (5 s).

Total target: **≈ 90 seconds** (trim to 60–90 s in post).

## Windows Game Bar Alternative

Press `Win + G` → Capture → *Start Recording*.  
Clip to the Blender window only via the source selector if available.

## Post-processing (optional)

```
ffmpeg -i screen_raw.mp4 -vf "scale=1920:1080" -c:v libx264 -crf 20 \
       -preset slow -an screen.mp4
```

## File Placement

Move the finished file to:
```
public/library/videos/scripting/python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr/screen.mp4
```
