# Screen Recording Notes — Mantaflow Smoke & Fire: Torch Flame

OBS Studio / Windows Game Bar instructions for capturing `screen.mp4`.

## Window Source

- Application: **Blender 5.1**
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **off**

## Prerequisites — Bake the Simulation First

The gas simulation **must be baked** before playback renders correctly:

1. Open `flame_torch.blend`.
2. Select **flame_domain** in the Outliner (the wireframe cube).
3. Go to **Properties** → **Physics** (water-drop icon) → **Fluid**.
4. Expand the **Cache** sub-panel; confirm `Cache Directory` reads `//cache/flame_torch/`.
5. Click **Bake All**.  At Resolution 80, 100 frames bakes in 2–8 minutes on CPU.
6. When complete, scrub the Timeline: flame should be visible from frame 5 onward.

## Setup Before Recording

1. Set Viewport Shading to **Rendered** (rightmost sphere icon in the header).
2. In the **Outliner**, hide `flame_domain` (click the eye icon) so the domain
   wireframe cube is invisible — only the flame volume shows.
3. Press **Numpad 0** to enter Camera view.
4. Timeline range: **1 – 100**.
5. Press **Space** to play through once; confirm flame flickers and rises.
6. Rewind with **Shift + Left Arrow**.

## What to Capture

| Time | Frames | Event |
|------|--------|-------|
| 0:00 – 0:04 | 1 – 10 | Flame ignites from emitter sphere; first fuel slug rises |
| 0:04 – 0:16 | 10 – 40 | Steady torch established; vorticity coiling visible on right-side orbit |
| 0:16 – 0:28 | 40 – 68 | Turbulence field producing strong lateral flicker; smoke cap diffusing |
| 0:28 – 0:41 | 68 – 100 | Full-height flame; left-to-right camera arc reveals 3-D column shape |

## Camera Angle

Press `Numpad 0` for the blueprint camera (three-quarter side view).

For more dramatic close-up: pull the camera in to `ORBIT_RADIUS = 1.5` and
set `ORBIT_HEIGHT = 0.20` to look up slightly at the flame base —
the yellow core fills the frame and smoke cap pushes out at the top.

For overhead plume shot: place camera at `(0, 0, 1.8)`, rotation
`(0°, 0°, 0°)` looking straight down — smoke expands in a disk pattern.

## Colour Grading Note

The scene world strength is 0.05 (almost black).  In OBS:
- Set **Colour Correction** filter Brightness to +5 if the smoke cap looks muddy.
- Do **not** increase exposure — flame emission is already near-white at the core.

## Output

Save as: `public/library/videos/physics/physics-mantaflow-smoke-fire-torch/screen.mp4`
Recommended codec: **H.264**, CRF 20 (slightly lower compression to preserve thin
smoke wisps at the top of the column, which compress poorly at CRF 23+).
