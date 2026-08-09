# Screen Recording Notes — Icosahedral Quasicrystal

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` → move to `public/library/videos/scripting/python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr/screen.mp4` |

## Steps to capture

1. Open `hf_quasicrystal_poi.blend` in Blender 5.1.
2. In the 3D Viewport header set shading to **Material Preview** (sphere icon) so
   the vertex-colour emission is visible.
3. Press `Numpad 0` to enter camera view — you should see the quasicrystal
   network against a dark background with coloured glowing nodes and tubes.
4. Start OBS recording.
5. Press **Space** or navigate Timeline → Play to run the 300-frame animation
   (10 seconds).  The camera orbits automatically via `record.py` keyframes.
6. Stop OBS after the animation loops back to frame 1.
7. Trim the clip to exactly 10 seconds in the video editor of your choice.

## What the viewer should see

- **F 1–60** Full 5-fold symmetric icosahedral cap visible at the top.
- **F 61–120** Camera drops to the equatorial plane — 5-fold rings appear.
- **F 121–180** Camera rises again with a roll — sideband vertex columns.
- **F 181–240** Reverse orbit — quasiperiodic bond network rhythm.
- **F 241–300** Camera pulls back — full 3D quasicrystal visible in one shot.

## Notes on appearance

- The node network should show **two distinct bond lengths** in ratio τ ≈ 1.618:1.
- Vertex beads glow violet-to-gold top-to-bottom (Z-height hue gradient).
- There are **no repeating unit cells** — the pattern is aperiodic but locally
  icosahedral at every 5- and 3-fold cross-section.
- If the mesh looks hollow, increase `WINDOW_RADIUS` in `blueprint.py` and re-run.
