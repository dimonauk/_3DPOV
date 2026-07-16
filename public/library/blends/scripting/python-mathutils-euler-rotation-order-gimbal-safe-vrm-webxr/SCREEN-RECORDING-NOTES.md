# Screen Recording Notes — mathutils.Euler VRM Rotation Mode Audit

**Output target**: `public/library/videos/scripting/python-mathutils-euler-rotation-order-gimbal-safe-vrm-webxr/screen.mp4`

## Software
OBS Studio (27+) or Windows Game Bar (`Win + G`). Audio off.

## Source
Window capture → Blender 5.1 (not display capture — avoids notification overlays).

## Settings
| Setting | Value |
|---------|-------|
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 / H.264 |
| Audio | Disabled |
| Encoder | x264 (software) or NVENC (hardware) |

## Scene to record

1. Open `vrm_euler_audit.blend` (created by blueprint.py).
2. Switch viewport to **Pose Mode** with the `VRM_Skeleton` armature selected.
3. In **Overlays** panel: enable **Bone Names**.
4. Set shading to **Solid → Bone Pose** so bones colour-code by mode
   (QUATERNION = blue, Euler = orange/yellow).
5. Expand the **Dope Sheet → Action Editor** in a second area to show
   `rotation_euler` vs `rotation_quaternion` channels side by side.
6. Open the **Python Console** or **Text Editor** and paste/run `blueprint.py`.

## Recording flow

1. Hit **Record** in OBS.
2. Run `blueprint.py` from the **Scripting** workspace — terminal output shows
   the gimbal severity audit table and the XYZ vs YXZ comparison lines.
3. After script finishes, switch back to the **Layout** workspace.
4. Play the timeline (Spacebar) — frames 1–45 demonstrate XYZ gimbal freeze,
   frames 46–90 show YXZ clean arm raise.
5. Pause and scrub to frame 22 (Y=90° in XYZ) to point out the locked axes
   in the Dope Sheet — both X and Z channels become redundant here.
6. Continue playback through to frame 90.
7. Stop recording.

## Ideal total length
3–5 minutes. No narration needed — a captions track can be added in post.

## Post-processing
Trim any dead time at the start. No colour grading required.
