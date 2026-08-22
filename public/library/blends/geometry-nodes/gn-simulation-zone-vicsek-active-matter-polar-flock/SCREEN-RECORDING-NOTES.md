# Screen Recording Notes — Vicsek Active-Matter Phase Transition

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no commentary needed) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/geometry-nodes/gn-simulation-zone-vicsek-active-matter-polar-flock/screen.mp4` |

## Capture sequence

1. Run `blueprint.py` — confirm the rainbow grid appears in the viewport.
2. Set Viewport Shading to **Rendered** (EEVEE Next).
3. In Timeline, set Start = 1, End = 280.
4. **Start OBS recording.**
5. Press **Space** to play the simulation from frame 1.
6. Watch three phases:
   - Frames 1–60: disordered (rainbow noise, short correlation)
   - Frames 60–160: coarsening (growing colour patches form)
   - Frames 160–280: ordered (one or two large coherent domains lock in)
7. Let it play to frame 280, then **Stop OBS recording**.

## What to show on screen

- Keep the **Viewport** maximised (full-screen with T, N panels hidden).
- Show the **Timeline** scrubber at the bottom so viewers can see the frame counter.
- Before recording: open the **Spreadsheet** editor briefly (≤ 5 s) to show the `theta`
  FLOAT attribute on the POINT domain — this confirms the simulation data is real.
- After frame 280: scrub back to frame 1 quickly to show the disordered → ordered
  contrast in a single pan.

## Thumbnail suggestion

Frame ≈ 190 — large coherent teal domains with magenta counterflow at domain walls.
Use this as the tutorial header image.
