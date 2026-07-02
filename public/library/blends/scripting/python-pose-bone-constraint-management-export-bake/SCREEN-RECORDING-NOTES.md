# Screen Recording Notes — Constraint Management & Export Bake

## Target file
`public/library/videos/scripting/python-pose-bone-constraint-management-export-bake/screen.mp4`

## Software
OBS Studio 30+ (or Windows Game Bar: Win+G)

## Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps CBR |

## What to capture

### Part 1 — Building the rig (approx. 2 min)
1. Open Blender 5.1, Scripting workspace.
2. Paste or open `blueprint.py`.
3. Scroll through the script so the `add_damped_track()` and
   `add_copy_location()` functions are visible.
4. Click **Run Script** — capture the console output showing bone names and
   constraint types in the audit table.

### Part 2 — Inspect constraints (approx. 1 min)
5. Switch to Layout workspace, select the armature, enter Pose mode.
6. Select the "Child" bone — show the Bone Constraint Properties panel
   with the Damped Track constraint visible.
7. Select the "Root" bone — show the Copy Location constraint.

### Part 3 — Mute-on-Export in action (approx. 1 min)
8. In the Scripting workspace, un-comment Strategy A or annotate Strategy B.
9. Re-run (or step through manually).
10. Open the output folder in the file browser to show the GLB was created.

### Part 4 — NLA Bake (approx. 1 min)
11. Un-comment the `bake_to_action()` call and re-run.
12. Switch to the NLA Editor — show the new "Baked" strip on the armature
    action track.
13. Check the Bone Constraint panel again — constraints are gone.

## Trim
Keep each part tight; aim for a total screen.mp4 under 6 minutes.
Add chapter markers in OBS or in post:
  0:00 — Build rig
  2:00 — Inspect constraints
  3:00 — Strategy B: Mute → Apply → Export
  4:30 — Strategy A: NLA Bake
