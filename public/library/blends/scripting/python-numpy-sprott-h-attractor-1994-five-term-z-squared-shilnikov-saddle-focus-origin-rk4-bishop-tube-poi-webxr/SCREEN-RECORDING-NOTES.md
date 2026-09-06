# Screen Recording Notes — Sprott H Attractor

**Output file:** `public/library/videos/scripting/python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr/screen.mp4`

## Before You Start

1. Run `blueprint.py` in Blender's Text Editor (Alt+R or ▶ button).
   Wait for the console to print `Sprott H complete`.
2. Confirm the cobalt→amber tube is visible in the viewport.
3. Set viewport shading to **Material Preview** (Z-key → Material Preview, or
   the sphere icon in the top-right of the 3D Viewport).

## OBS Setup

| Setting | Value |
|---------|-------|
| Source  | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no audio on viewport recordings) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## What to Show (approx. 30–45 seconds)

1. **Start paused** — show the Basis attractor (a=0.50) rotating slowly
   in Material Preview. Point out the tight spiral lobe near the origin
   (the Shilnikov saddle-focus region) and the long excursion arc (z² kick).

2. **Shape-key sweep** — with the Properties panel open, scrub the
   shape-key values manually:
   - Basis → SK_LoA: tube tightens as ∇·F drops to −0.75.
   - SK_LoA → SK_HiA: orbit opens up as dissipation weakens.
   - SK_HiA → SK_NearCons: very large cloud, ∇·F ≈ −0.05.

3. **Overlay: fixed-point markers** (optional) — add two small Empty objects
   at P₀=(0,0,0) and P₁=(−2,4,−2) and label them in the 3D viewport's
   N-panel. Zoom in briefly on P₀ to show the spiral convergence.

4. **Python panel** — briefly show the `blueprint.py` source in the Text
   Editor, scrolling to the `_f()` function so viewers can see the three
   ODE lines.

5. **End** — orbit the canonical basis tube one full rotation.

## Tips

- Lock the camera to the viewpoint for smooth motion: View menu →
  Lock View to Active or use Numpad-0 then orbit in camera view.
- If the tube looks faceted, increase `TUBE_SEGS` to 12 in blueprint.py
  and re-run (costs ~50 % more vertices, still fast).
- To highlight the Shilnikov spiral region, add a point lamp at P₀ with
  a blue tint and low energy (0.3 W) — it back-lights the tight lobe.

## After Recording

Move the raw `.mkv` / `.mp4` file to:
```
public/library/videos/scripting/
  python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-
    saddle-focus-origin-rk4-bishop-tube-poi-webxr/
      screen.mp4
```
Trim leader/trailer in DaVinci Resolve or `ffmpeg -ss 2 -t 30 -i raw.mp4 screen.mp4`.
