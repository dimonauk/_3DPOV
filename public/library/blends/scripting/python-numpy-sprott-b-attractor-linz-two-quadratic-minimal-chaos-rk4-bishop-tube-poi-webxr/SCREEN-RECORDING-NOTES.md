# Screen-Recording Notes — Sprott B Attractor

Target file: `public/library/videos/scripting/python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software

OBS Studio 30.x **or** Windows Game Bar (Win+G → Capture)

## Before you start

1. Open Blender 5.1 and load (or run) `blueprint.py` from the Text Editor.
2. Switch to the **3D Viewport** in **Rendered** mode (Eevee Next).
3. Enable **Viewport Denoising** (Render Properties → Sampling → Denoise).
4. In the 3D Viewport header, set **Overlays → OFF** (hide axes, grid, gizmo).
5. Enable **Bloom** in Render Properties → Eevee → Bloom: threshold 0.30, intensity 0.22.
6. Set Viewport shading background to **black** (Viewport Shading → World → Black).

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264) |
| Bitrate | 8000 kbps CRF |
| Audio | **Off** |

## Recording sequence (~90 seconds)

1. **0–15 s**: Press **Numpad 0** (Camera view). Press **Space** to start animation.
   Show the first phase: full 360° orbit around the canonical Sprott B attractor.
   The cobalt–amber gradient should be clearly visible on the tube.

2. **15–45 s**: Pause animation at frame 60. Drag the shape-key slider for
   `SK_cLow` from 0 → 1 slowly while rotating the view manually (middle-mouse).
   Show how the attractor contracts as c drops from 1.0 → 0.7.

3. **45–75 s**: Reset `SK_cLow` to 0, then morph `SK_cHigh` from 0 → 1.
   Show the expanded attractor (c=1.4) from several angles.
   Point out that the single-lobe topology is preserved — unlike Lorenz,
   there is no second scroll.

4. **75–90 s**: Set `SK_cWide` = 1, all others = 0. Rotate slowly. The attractor
   widens toward a bifurcation boundary — orbit becomes looser and more open.

## After recording

- Trim to 60–90 s in DaVinci Resolve or ffmpeg.
- Compress:
  ```
  ffmpeg -i screen_raw.mp4 -vf scale=1920:1080 -c:v libx264 -crf 22 -preset slow screen.mp4
  ```
- Place at: `public/library/videos/scripting/python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr/screen.mp4`

## What to point out on camera

- The **six-term** simplicity: show the code — `ẋ = y·z`, `ẏ = x − y`, `ż = 1 − x·y`
- The **single equilibrium** at (0, 0, c): highlight how one saddle-focus sustains chaos
- The **constant divergence −1**: all dissipation from a single linear term −y
- The **Kaplan–Yorke dimension ≈ 2.039**: very thin fractal, almost a 2-D surface
- Compare visually with the Thomas attractor (same 6-term count but uses sin) and
  the Rössler attractor (also one quadratic but 7 terms)
