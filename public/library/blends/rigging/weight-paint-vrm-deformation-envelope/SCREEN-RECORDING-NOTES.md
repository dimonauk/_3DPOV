# Screen Recording Notes — Weight-Paint VRM Deformation Envelope

**Target file:** `public/library/videos/rigging/weight-paint-vrm-deformation-envelope/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no narration needed for loop video) |
| Output format | MP4 / H.264 |

## Shot list

### 1 — Auto-weight result (00:00 – 00:20)

Open `weight_paint_vrm.blend` (saved after running blueprint.py). Select the
torso mesh. Switch to **Weight Paint** mode (`Ctrl+Tab`). In the Properties
sidebar activate vertex group `spine.002`. Show the blue-to-red gradient
across the chest region. Pan slowly around the rig.

### 2 — Pose deformation test (00:20 – 00:50)

With the rig visible, enter **Pose Mode** on the armature (`Ctrl+Tab`).
Select `upper_arm.L`, rotate it 60° on the local Y axis (`R Y 60`). Return
to 0°. Select `spine.001`, rotate 20° on local X (`R X 20`). Show any
pinching artefacts before and after smoothing (compare weight-paint heat maps
for `shoulder.L` vs `upper_arm.L` at the seam).

### 3 — Limit Total operator (00:50 – 01:10)

Object Mode → Properties → Mesh Data → Vertex Groups panel. Show the group
count per vertex by hovering over vertices in Edit Mode with the **N panel →
Item** section. Run `Object → Vertex Groups → Limit Total` (set to 4). Show
the reduced influence count.

### 4 — Mirror X (01:10 – 01:30)

In Object Mode, run `Object → Vertex Groups → Mirror`. Switch to Weight
Paint, activate `upper_arm.R`. Confirm the same gradient appears on the
right arm stub.

## Tips

- Use **Viewport Overlay → Overlays → Bone Weights** toggle to show/hide the
  weight gradient while in Weight Paint mode.
- Press `Alt+Z` in Weight Paint mode to enable X-Ray so geometry behind the
  surface is visible during brush strokes.
- Record the full `blueprint.py` run in a terminal window for the speed-run
  section — shows the automated pipeline in ~30 seconds.
