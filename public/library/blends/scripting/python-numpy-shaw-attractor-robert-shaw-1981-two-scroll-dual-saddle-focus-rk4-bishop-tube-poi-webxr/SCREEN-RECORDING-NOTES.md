# Screen-Recording Notes — Shaw Attractor

Target file: `public/library/videos/scripting/python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr/screen.mp4`

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

1. **0–20 s**: Press **Numpad 0** (Camera view). Press **Space** to start animation.
   Show the canonical Basis attractor (a=10, b=4.272) from multiple angles.
   Point out the **two symmetrically-placed scrolls** — both cobalt near the
   equilibria, amber during the fast switching events.

2. **20–45 s**: Pause at frame 60. Drag `SK_LoA` slider from 0 → 1 slowly.
   Show how the attractor **broadens** as coupling constant a drops from 10 to 7.
   The divergence drops from −11 to −8, so the orbit opens outwards.

3. **45–65 s**: Reset `SK_LoA` to 0, set `SK_HiA` to 1 (a=12).
   Show the **tighter orbit** — higher dissipation ∇·F=−13 pulls trajectories
   closer to the two equilibria before switching.

4. **65–90 s**: Set `SK_HiB` = 1, others = 0 (a=10, b=7.5).
   Larger forcing constant pushes equilibria further from origin:
   P± ≈ (±0.866, ∓0.866, 0.1) vs. the canonical ±0.654.
   The scrolls visibly widen.

## After recording

- Trim to 60–90 s in DaVinci Resolve or ffmpeg.
- Compress:
  ```
  ffmpeg -i screen_raw.mp4 -vf scale=1920:1080 -c:v libx264 -crf 22 -preset slow screen.mp4
  ```
- Place at: `public/library/videos/scripting/python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr/screen.mp4`

## What to point out on camera

- The **5-term count**: ẋ=−a(x+y), ẏ=−y−axz, ż=axy+b — one fewer than Lorenz's 7
- The **Z₂ symmetry**: negating x and y leaves every term unchanged — the two scrolls
  are exact reflections, distinguishable here only by the amber inter-scroll events
- The **constant divergence** ∇·F = −(a+1): change the `a` slider and show that
  the equilibria shift position (z₀=1/a, x₀=±√(b/a)) in real time
- The **strong chaos**: λ₁≈+0.368, nine times larger than Lorenz's +0.041 per Shaw's
  information-flow analysis
- Compare with Lorenz (7 terms, Z₂ symmetry but from −y term not from x+y coupling)
  and Rössler (7 terms, single scroll only)
