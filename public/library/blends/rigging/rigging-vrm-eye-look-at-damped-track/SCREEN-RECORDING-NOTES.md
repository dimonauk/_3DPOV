# Screen Recording Notes — VRM Eye Look-At Rig

## Software
- OBS Studio or Windows Game Bar (Win+G)
- Blender 5.1

## Capture settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration for this clip) |
| Output format | MP4 / H.264 |
| Destination | `public/library/videos/rigging/rigging-vrm-eye-look-at-damped-track/screen.mp4` |

## Steps to record

1. Open Blender 5.1. Load or run `blueprint.py` in the Scripting workspace.
2. Switch to the **Layout** workspace. Select the `vrm_eye_rig` armature. Enter **Pose Mode** (Tab).
3. Reveal the **Properties** panel (N key). Set viewport shading to **Material Preview**.
4. In the **Properties Editor → Object Constraint Properties**, confirm LeftEye shows:
   - `DampedTrack_LookAt` → track axis `-Y` → target `vrm_eye_rig / LookTarget`
   - `LimitRot_EyeClamp` → X: −30°..30°, Z: −40°..40°
   Confirm RightEye shows:
   - `CopyRot_FromLeft` → source `LeftEye` → invert Z ✓
   - `LimitRot_EyeClamp`
5. Select the **LookTarget** bone (click it in the viewport).
6. In the N-panel (**Item** tab) G-grab and move it left/right/up/down to demonstrate both eyes tracking smoothly.
7. Show the Properties → Constraint panel to explain the chain order.
8. Switch to the **Graph Editor** and play the recorded keyframe sweep (from `record.py`).
9. Stop recording once the sweep completes and returns to centre.

## Editing note
Trim to the moment both eye bones visibly track the moving LookTarget.
Add a caption overlay: "Damped Track → Limit Rotation → Copy Rotation (inverted Z)".
