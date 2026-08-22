# Screen Recording Notes — Van der Pol Nonlinear Limit Cycle

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/geometry-nodes/gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi/screen.mp4` |

## Capture sequence

1. Run `blueprint.py` — confirm a flat blue grid appears (all vdp_x ≈ 0).
2. Set Viewport Shading to **Rendered** (EEVEE Next, emission bloom on).
3. In Timeline, set Start = 1, End = 300.
4. **Start OBS recording.**
5. Press **Space** to play.
6. Watch three phases:
   - **Frames 1–60**: each oscillator spirals outward from its random
     start toward the limit cycle independently — chaotic ripple, no structure.
   - **Frames 60–160**: Huygens coupling begins to matter; neighbouring
     oscillators align phase; local domains of red/blue alternation emerge.
   - **Frames 160–300**: large phase-coherent waves travel across the
     surface — rolling hills of warm red advancing into cool blue troughs.
7. Let it play to frame 300, then **Stop OBS recording**.

## What to show on screen

- Keep the **3-D Viewport** in perspective (NumPad 0 → camera view).
- Before recording: briefly open the **Spreadsheet** editor (≤ 5 s) to show
  the `vdp_x` and `vdp_v` FLOAT attributes on the POINT domain — confirm
  values are evolving and not frozen at their initial values.
- At about frame 120: pause, open the **Shader Editor** briefly to show
  the `x_01` attribute driving the ValToRGB colour ramp.
- Thumbnail suggestion: frame ≈ 200 — large coherent wave crests (deep red)
  rolling diagonally across the grid, separated by blue troughs.
