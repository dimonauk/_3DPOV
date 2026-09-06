# Screen-Recording Notes — Arneodo–Coullet–Tresser Attractor

Target file:
`public/library/videos/scripting/python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software

OBS Studio 30.x **or** Windows Game Bar (Win+G → Capture)

## Before you start

1. Open Blender 5.1 and run `blueprint.py` from the Text Editor (Alt+R).
2. Switch the 3D Viewport to **Rendered** shading mode (Eevee Next).
3. Enable **Viewport Denoising** (Render Properties → Sampling → Denoise).
4. Toggle **Overlays OFF** in the Viewport header (hide grid, gizmo, axes).
5. Enable **Bloom**: Render Properties → Eevee → Bloom — threshold 0.25, intensity 0.20.
6. Set Viewport shading background to **black** (Viewport Shading → World → Black).

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps CRF |
| Audio | **Off** |

## Recording sequence (~90 seconds)

1. **0–20 s**: Numpad 0 (Camera view). Press Space to play the animation.
   Show the **Basis attractor** (α=0.2, β=−1.4, γ=7.5) rotating slowly.
   Point out the **two symmetric scrolls** — the Z₂ double-well structure —
   and how the cobalt sections mark slow spiralling near each saddle-focus,
   while amber flashes mark the fast inter-scroll switching events.

2. **20–45 s**: Pause at frame 60. Drag the `SK_LowG` slider slowly from 0 → 1.
   Narrate: "γ drops from 7.5 to 5.5; the fixed points P± move inward
   from ±2.74 to ±2.35, and the Shilnikov ratio shrinks — the attractor
   tightens, the switching events become more frequent."

3. **45–65 s**: Reset `SK_LowG` → 0, drag `SK_HighG` from 0 → 1.
   Narrate: "γ rises to 9.5; P± push out to ±3.08 — wider double-scroll,
   the jerk term still keeps everything bounded because x³ dominates for
   large x even as γ grows."

4. **65–90 s**: Reset `SK_HighG` → 0, drag `SK_LowAlp` from 0 → 1.
   Narrate: "α falls from 0.20 to 0.08 — weaker damping, ∇·F = −0.08
   instead of −0.20.  Phase-space volume contracts four times more slowly,
   so the orbit visits far more of the double-well before being pulled
   back.  Lyapunov exponents shift toward zero."

## Post-processing

Trim to 60–90 s, then compress:
```bash
ffmpeg -i screen_raw.mp4 -vf scale=1920:1080 -c:v libx264 -crf 22 -preset slow screen.mp4
```

Place at:
`public/library/videos/scripting/python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr/screen.mp4`

## Key talking points

- **Jerk form**: ẍ + 0.2·ẍ + (−1.4)·ẋ − 7.5x + x³ = 0 — a Duffing oscillator
  with a jerk dissipation term added.  The smallest possible extension that
  produces bounded spiral chaos in 3D.

- **Z₂ symmetry**: negate x, y, z simultaneously and every term is unchanged —
  the system is symmetric about the origin.  The two scrolls are literal mirror
  images, which the colour coding confirms (identical cobalt/amber patterns).

- **Shilnikov saddle-foci at P±**: at (±2.74, 0, 0) the eigenvalues are
  λ_s ≈ −2.72 (real, stable) and λ_u ≈ 1.26 ± 1.98i (unstable spiral).
  Ratio ρ = 2.16 > 1 — Shilnikov's theorem guarantees infinitely many
  horseshoes and a chaotic set.

- **Constant divergence**: ∇·F = −α = −0.20 — independent of position,
  unlike systems such as Finance or Sprott D. Changing α uniformly re-scales
  the contraction rate everywhere.

- **Compare with Genesio–Tesi** (also a jerk system but with x², single
  fixed point) and **Shimizu–Morioka** (Z₂ symmetric, similar era, laser physics).
