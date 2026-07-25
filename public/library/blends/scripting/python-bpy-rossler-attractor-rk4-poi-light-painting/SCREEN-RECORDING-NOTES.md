# Screen Recording Notes — Rössler Strange Attractor

## OBS / Game Bar Setup

**Window source**: Blender 5.1 (full window — include top bar)
**Resolution**: 1920 × 1080
**Frame rate**: 30 fps
**Audio**: off (or ambient room tone only)
**Output**: `screen.mp4` in this folder

## What to capture

1. **Open Blender 5.1** — Scripting workspace visible.
2. **Open `blueprint.py`** — show the parameters block at the top.
3. **Explain key constants** (talk-through or on-screen text):
   - `A=B=0.2, C=5.7` — classic chaotic regime
   - `N_TRAJ=8` — eight simultaneous trajectories
   - `EPSILON=0.025` — tiny angular spread in initial seeds
4. **Press Run Script** — let the integration run (~10–30 s depending on CPU).
5. **Switch to 3D Viewport** — Rendered shading, EEVEE Next.
6. **Play the animation** (Spacebar) — show all eight tubes growing simultaneously.
   - Pause at frame 60 — trails still tightly coiled, nearly overlapping.
   - Pause at frame 240 — trails separating as the fold scrambles their order.
   - Play to frame 480 — full chaotic spread visible.
7. **Rotate the view** to show the z-fold structure (the high-z excursion loop).
8. **Open `record.py`** and Run Script to trigger the viewport render.

## Suggested angles

| Angle         | What it shows                              |
|---------------|--------------------------------------------|
| Top-down (Z+) | Classic Rössler spiral — clear out-winding |
| Side (Y+)     | z-fold height and fold-back amplitude       |
| 30° oblique   | Both spiral and fold together (camera default) |

## Duration

Target: 3–5 minutes. Edit for:
- Blueprint walkthrough: 60 s
- Scripting-run + render: 30 s  
- Viewport animation + orbit: 90 s
- Parameter experiment (change C to 14.0 for funnel chaos): 60 s

## Editing notes

- Speed-ramp the `Run Script` wait (render progress) to 4× or cut to result.
- Add soft music under the animation playback segment.
- Subtitles for ODE explanation (dx/dt = −y − z / dy/dt = x + ay / dz/dt = b + z(x−c)).
