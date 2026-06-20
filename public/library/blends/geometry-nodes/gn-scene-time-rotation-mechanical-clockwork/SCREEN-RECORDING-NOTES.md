# Screen Recording Notes — GN Clockwork

## Target file

`public/library/videos/geometry-nodes/gn-scene-time-rotation-mechanical-clockwork/screen.mp4`

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled (no audio track) |
| Output format | MP4 / H.264, CRF 18 |

## What to capture

1. Open `blueprint.py` in the Blender Scripting workspace and run it (Alt+P).
   Show the scene building in the 3D Viewport as the script executes.
2. Switch to the **Layout** workspace. Show the three objects:
   `gear_big`, `gear_small`, `pendulum`.
3. Select `gear_big` → Properties → Modifier Properties. Show the
   `SceneTimeRotation` GN modifier. Expand to show the node group name.
4. Click the node group icon to open it in the GN editor. Walk through:
   - `Scene Time → Frame`
   - `Math(MULTIPLY)` with the angle-per-frame constant visible
   - `Combine XYZ` (only Z connected)
   - `Euler to Rotation` node (point out the Rotation socket type, teal colour)
   - `Transform Geometry`
5. Press **Space** to play the timeline. Show all three objects animating.
   Pan the viewport to show the gears meshing and the pendulum swinging.
6. Scrub back to frame 1, then let it play again at normal speed for ~5 s.

## Duration

Aim for 3–5 minutes total. The core GN tree walkthrough (step 4) should take
about 90 seconds — that is the teaching moment.

## Post-processing

Trim to remove any scripting compile pauses. No colour grading required.
Export at H.264 baseline profile for maximum browser compatibility.
