# Screen Recording Notes — Euler Rigid Body Poi Staff

Record the **Blender viewport** showing the poi staff spinning under torque-free
precession, with the amber polhode trail orbiting alongside it.

## Software

- **OBS Studio** (recommended) or Windows Game Bar (Win+G)
- Blender 5.1 open in 3D Viewport, Solid or Material Preview mode

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Audio | OFF (no audio in viewport recording) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/scripting/python-numpy-euler-rigid-body-spinning-top-precession-poi-staff/screen.mp4` |

## What to capture

1. **Run blueprint.py** — capture the Python console output showing T_drift and
   L_drift values.  Conservation error < 1e-5 confirms RK4 accuracy.
2. **Switch to 3D Viewport** — show the staff cylinder spinning with the glowing
   amber polhode trail.  Use numpad 5 (orthographic) then Numpad 4/6 to orbit.
3. **Play the animation (Spacebar)** — 240 frames at 24 fps = 10 seconds.
   For ASYMMETRIC preset: the staff precesses smoothly, the polhode traces a
   banana-shaped closed loop.
   For INTERMEDIATE preset: capture the moment the spin axis flips — the
   "tennis-racket effect" is the dramatic visual payoff.
4. **Show the Preset comparison** — change `PRESET = "SYMMETRIC"` and re-run to
   show the clean circular polhode.  Good edit cut point.

## Duration

Aim for 60–90 seconds total.  A simple edit: run → console output → viewport
orbit → animation playback → preset swap.

## Post-processing

Trim silence.  No colour-grading needed — the black EEVEE background with bloom
gives the light-painting aesthetic already.
