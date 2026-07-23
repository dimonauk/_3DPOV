# Screen Recording — SPH Fluid Particles (Blender 5.1)

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting/screen.mp4`

## Setup

1. Run `blueprint.py` in Blender's Scripting workspace.  
   Object `hf_sph_fluid` appears — 320 glowing spiral particles above a bowl boundary.
2. Scrub frame 1 → 120 to verify the simulation bakes correctly before recording.  
   Particles should spiral inward, pool at the bowl floor, and slosh gently.

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender (not desktop) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | x264 / H.264 |

## Shot sequence (≈90 s total)

| Segment | Duration | What to show |
|---|---|---|
| 1 | 10 s | Scripting workspace — blueprint.py selected, `Run Script` button visible |
| 2 | 8 s | Switch to 3D Viewport — particles in spiral emit pose at frame 1 |
| 3 | 20 s | Scrub playhead 1 → 120; hold at frame 30 (first pooling), 60 (sloshing), 120 (rest) |
| 4 | 12 s | EEVEE render preview — Bloom glow on particles visible, black background |
| 5 | 15 s | Geometry Nodes editor — Simulation Zone, IndexOfNearest, SampleIndex visible |
| 6 | 10 s | Material preview — ColourRamp stops, Emission node tree |
| 7 | 15 s | Render viewport animation (⎈Ctrl+F12) — watch first 20 frames build |

## Key moments to highlight

- Frame 1–15: spiral emitter — particles still in formation, tangential velocity visible
- Frame 16–45: pressure repulsion kicks in — particles spread outward, then curve inward under bowl boundary
- Frame 46–80: pooling — slow particles turn violet, fast-falling ones glow white
- Frame 81–120: fluid at rest — cyan pool, gentle rippling from boundary repulsion

## Post-processing (optional)

Trim to 15 s highlight reel (frames 1–30 in ×4 speed, frames 30–120 in ×2 speed).  
Upload as `screen.mp4` alongside `viewport.mp4`.
