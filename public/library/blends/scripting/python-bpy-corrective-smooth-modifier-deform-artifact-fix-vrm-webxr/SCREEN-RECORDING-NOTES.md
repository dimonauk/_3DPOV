# Screen Recording Notes — CorrectiveSmoothModifier

## Setup

1. Open `hf_corrective_smooth_arm.blend` in Blender 5.1.
2. In OBS Studio: Source → Window Capture → select **Blender** window.
3. Resolution: **1920×1080**, Frame rate: **30fps**, Audio: **off**.
4. Output: `public/library/videos/scripting/python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr/screen.mp4`

## What to capture

| Sequence | Action |
|----------|--------|
| 0:00–0:15 | Show Properties panel → Modifier stack (Armature → CorrectiveSmooth); highlight key parameters |
| 0:15–0:30 | Drag the Forearm bone in Pose Mode from 0° to 90°; show the elbow crease filling in |
| 0:30–0:45 | Toggle CorrectiveSmoothModifier on/off (eye icon) to show before/after at 90° bend |
| 0:45–1:00 | Scrub through the animation (spacebar); show `smooth_type` and `iterations` settings |

## Tips

- Split the viewport: Properties on the right, 3D Viewport on the left.
- Material Preview mode (`Z → Material Preview`) shows the skin tone best.
- Zoom in on the elbow for the toggle comparison — the volume difference is most visible at the crease.
- Show the vertex group `cs_elbow` in Weight Paint mode briefly to illustrate modifier masking.
