# Screen Recording Notes — Armature & Weight Painting

## Goal

Capture Dimona running `blueprint.py` to build the rigged character, then
switching to Weight Paint mode to show the auto-generated weights on the
shoulder joint, manually painting a correction, and watching the deformation
change in the 3D viewport.

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Capture source | Blender 5.1 application window |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Optional — short voice note at the "before / after" paint correction moment is helpful |
| Output filename | `screen.mp4` |

## Sequence to capture

**0:00 – 0:15** — Blender open, default scene. Open Text Editor. Text > Open
→ select `blueprint.py`. Show the script briefly.

**0:15 – 0:30** — Run Script (Alt+P). The torso + arm mesh and armature appear.
Switch to the 3D viewport. Orbit to show the shoulder area.

**0:30 – 0:50** — Select the mesh. Switch to Weight Paint mode (Ctrl+Tab or
the mode selector at top-left of the viewport). The mesh colours by weight:
red = full influence (1.0), blue = no influence (0.0). Select the UpperArm.R
vertex group from the side panel (N > Item > Vertex Groups) to inspect the
arm bone's weights.

**0:50 – 1:10** — Show the shoulder: the auto-generated weights may bleed into
the torso. With the paint brush (weight = 0.0, Subtract mode), paint over
the torso vertices near the shoulder to reduce the arm bone's influence there.
The mesh colour shifts from orange-red toward blue as you paint.

**1:10 – 1:30** — Test the pose: switch to Pose Mode (Ctrl+Tab again). Select
the UpperArm.R bone and rotate it (R, Y, -90, Enter). The arm should raise;
the shoulder vertices should not drag the torso with it. Note any remaining
bleed-through.

**1:30 – 1:50** — Undo the pose (Ctrl+Z). Switch back to Weight Paint mode and
show the corrected weight map. Compare "before" (auto weights, possibly bleeding)
and "after" (manual correction) if two Blender windows are available side by side.

**1:50 – 2:00** — End recording.

## Delivery

Drop the completed `screen.mp4` at:

```
public/library/videos/rigging/armature-weight-paint/screen.mp4
```
