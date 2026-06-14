# Screen Recording Notes — Bone Collections + Custom Bone Shapes

## OBS Setup

- **Source**: Window Capture → Blender 5.1
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: Off (add music in post if needed)
- **Output**: `screen.mp4` → move to `public/library/videos/rigging/armature-bone-collections-custom-shapes/`

## Suggested Recording Flow

### 0:00 – 0:30  Before: open Outliner → Properties → Object Data (armature icon)
Show the empty Properties → Object Data → Bone Collections panel — it will be
populated as you run the blueprint.

### 0:30 – 2:00  Run blueprint.py
Open the Scripting workspace, load `blueprint.py`, press Run Script.
The rig should appear in the viewport with ring/circle/diamond shapes visible on
the root and IK target bones.

### 2:00 – 3:30  Bone Collections in the Outliner
Switch to the Outliner in Bone Collection mode (icon at top-right of Outliner).
Show the seven named collections — click the eye icon to hide "Arm IK.L" and "Arm IK.R",
demonstrating how cleanly you can toggle visibility by name rather than guessing
layer indices.

### 3:30 – 5:00  Custom bone shapes in the viewport
With the armature selected, switch to Pose Mode (Ctrl+Tab).
Click the root bone — the large ring highlights.
Click ctrl_ik_wrist.L — the circle highlights.
Click ctrl_ik_pole.L — the diamond highlights.
Open Properties → Bone → Display → Custom Shape to show the shape reference.

### 5:00 – 6:30  Animate a quick test pose
Grab ctrl_ik_wrist.L (G → X → drag) to show the IK target moving.
Note: IK constraints are NOT set up in this blueprint (see the IK Robot Arm
tutorial for that) — this records purely the visual gizmo system.

### 6:30 – 7:00  Closing shot
Return to rest pose (Alt+R, Alt+G on all bones).
Orbit the camera to show the full rig.
End recording.

## Talking Points

- "Before Blender 4.0, this was 32 checkboxes with no names. You had to remember
  that layer 3 was FK controls. Now it's just called 'Arm FK.L'."
- "The shape objects live in the SHAPES collection which is excluded from the view
  layer — they render as bone gizmos but never appear in your final render."
- "use_custom_shape_bone_size means the shape scales automatically as you resize
  the rig — you never have to chase down shape scales when a character changes size."
