# Screen Recording Notes — Mantaflow Liquid: Dam Break over a Step Obstacle

OBS Studio / Windows Game Bar instructions for capturing `screen.mp4`.

## Window Source

- Application: **Blender 5.1**
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **off**

## Prerequisites — Bake the Simulation First

The fluid simulation **must be baked** before anything renders:

1. Open `dam_break.blend`.
2. Select **dam_domain** in the Outliner (the large transparent cube).
3. Go to **Properties panel** → **Physics** (water-drop icon) → **Fluid**.
4. Expand the **Cache** sub-panel; confirm `Cache Directory` reads `//cache/mantaflow_dam_break/`.
5. Click **Bake All**.  At Resolution 64, 120 frames bakes in 3–10 minutes on a modern CPU.
6. When complete, the **dam_domain_mesh** object appears in the Outliner and animates water as you scrub the Timeline.

## Setup Before Recording

1. Scrub to frame 1.  The water column should appear as a solid rectangular block at the left of the domain.
2. Set Viewport Shading to **Material Preview** (sphere icon) or **Rendered** for full Cycles quality.
3. In the **Outliner**, hide `dam_domain` (click the eye icon) so the domain cube wireframe does not appear.
4. Switch to **Camera** view with `Numpad 0`.
5. Timeline range: **1 – 120**.
6. Play through once (`Space`) to confirm water animates, then rewind (`Shift + Left Arrow`).

## What to Capture

| Time | Frames | Event |
|------|--------|-------|
| 0:00 – 0:02 | 1 – 20 | Water column at rest; leading edge begins accelerating toward step; front face becomes vertical bore |
| 0:02 – 0:05 | 20 – 60 | Bore reaches step face; primary upward splash climbs step; water simultaneously wraps around both step ends |
| 0:05 – 0:08 | 60 – 96 | Overflow cascade over step top; reflected bore travels back left; turbulent secondary splash |
| 0:08 – 0:10 | 96 – 120 | Settling; thin water sheet covers floor; low-amplitude oscillation |

## Camera Angle

The blueprint camera (`Numpad 0`) is a front view at 40 mm — good for showing the full
width but flattens 3-D side-flow.

For a more dynamic capture: orbit to a **three-quarter view** from `(+X +Y +Z)` so
the step face, side flows, and overflow cascade are all visible simultaneously.  Hold
`Middle Mouse` and drag, or use `Numpad 3` then orbit.

## Output

Save as: `public/library/videos/physics/physics-mantaflow-liquid-dam-break/screen.mp4`
Recommended codec: **H.264**, CRF 23.
