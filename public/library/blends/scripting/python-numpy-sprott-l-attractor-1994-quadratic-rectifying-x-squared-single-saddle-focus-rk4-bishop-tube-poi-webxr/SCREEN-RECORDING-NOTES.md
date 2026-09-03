# Screen Recording Notes — Sprott L Attractor

These instructions are for capturing `screen.mp4` using OBS or Windows Game Bar.

## Setup (do once)

1. Open `blueprint.py` in Blender's **Text Editor**, run it (`Alt+R`).
   Wait for the tube to appear in the 3D viewport (≈ 10–15 seconds).
2. Switch to **Rendered** viewport shading (Z → Rendered) to see the glow.
3. Maximise the 3D viewport (`Ctrl+Space`).

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 or NVENC |
| Audio | **Off** |
| Output format | MP4 |

## What to record

**Pass 1 — Orbit reveal (0–60 s)**
- Enable **Auto Rotate** in the viewport header (`N` panel → View → Auto Rotate).
- Let the view spin one full revolution.  The tube's helical winding becomes
  clear from the changing silhouette.

**Pass 2 — Shape key sweep (60–120 s)**
- Open the **Properties** panel (`N`) → Object Data → Shape Keys.
- Slowly scrub `Basis → SK_HighA` (slide the value from 0 → 1 → 0).
- Then `Basis → SK_LowB`, then `Basis → SK_Compact`.
- Pause 3–4 seconds at each peak so the viewer can see the orbital topology shift.

**Pass 3 — Close-up of fixed point (120–150 s)**
- Zoom into the dense amber region (near the fixed point saddle-focus).
- The colour transition from cobalt (fast passages) to amber (slow spiralling)
  is most dramatic here — it's the visual signature of the Shilnikov mechanism.

## Output

Save as `screen.mp4` and place at:

```
public/library/videos/scripting/
python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr/
screen.mp4
```
