# Screen Recording Notes — Heat Diffusion Dome

Target file: `public/library/videos/geometry-nodes/gn-blur-attribute-heat-diffusion/screen.mp4`

## Setup

1. Open `heat_diffusion_dome.blend` in Blender 5.1.
2. Set viewport shading to **Material Preview** (press Z → Material Preview, or
   click the sphere icon in the top-right of the 3D Viewport).
3. Dock the **Geometry Nodes editor** below the 3D Viewport so both panels
   are visible simultaneously.  
4. Scrub to frame 1 — the dome shows only the sharp orange pole cap.

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |

## Recording steps

1. **Start recording.**
2. Slowly drag the **Iterations** slider in the GN modifier properties
   from **1 → 24** (watch the diffusion spread from the pole toward the
   equator — the insulation band around Z=0 slows the propagation visibly).
3. Continue dragging back to **1** so the heat retracts to the pole.
4. Stop recording.  Trim to ≈ 15 seconds.

## What to highlight during recording

- The sharp orange cap at Iterations=1.
- The smooth gradient falloff growing as iterations increase.
- The slight slowdown at the equatorial band (dark insulation ring) —
  this is the Equator_Resistance socket at work.
- The dome surface lifting at the hot pole (displacement along normals).

## Notes

- If the colour ramp looks flat in Material Preview, switch to **Rendered**
  shading with EEVEE Next for the emission glow.
- Ensure `export_attributes=True` in the GLB export settings so
  `heat_blurred` survives as a custom vertex attribute.
