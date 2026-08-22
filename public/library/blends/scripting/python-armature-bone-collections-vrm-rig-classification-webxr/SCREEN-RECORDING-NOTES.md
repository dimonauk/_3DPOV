# Screen Recording Notes — Bone Collections Rig Classification

## Goal

Capture a screen recording of Blender's armature editor and Properties panel
showing the BoneCollection workflow: creating collections, assigning bones, and
seeing the colour-coded classification in the viewport.

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no commentary needed for this segment) |
| Output | `screen.mp4` beside `viewport.mp4` in the same folder |

## What to Record (3–5 minutes)

### Part 1 — Open the blend (0:00–0:30)

1. Open `rig_classified.blend` in Blender 5.1.
2. Switch viewport to **Solid** shading mode.
3. Press **Numpad 0** (front orthographic) so the full armature is visible.
4. Show the **Properties → Object Data (armature icon)** panel — the Bone
   Collections section should list DEF / CTRL / MCH / ROOT.

### Part 2 — Bone Collections in the sidebar (0:30–2:00)

1. Click the **DEF — Deform** collection row to make it active (blue highlight).
2. Click the eye icon next to MCH — Mechanism to hide it.
3. Click the eye icon again to show it.
4. Select one DEF bone in the viewport — show in the Properties panel that its
   `Use Deform` checkbox is ticked.
5. Select one CTRL bone — show that `Use Deform` is unchecked.

### Part 3 — Pose bone colours (2:00–3:30)

1. Switch to **Pose mode** (Tab key with armature selected).
2. Show the green DEF bones, red CTRL bones, teal MCH bones simultaneously.
3. Click one bone and go to **Properties → Bone → Viewport Display → Colour** to
   show the palette picker.
4. Pan the viewport slowly to reveal the full rig side-on.

### Part 4 — Python Script Editor (3:30–5:00)

1. Split the viewport and open the **Text Editor**.
2. Open `blueprint.py` and scroll through the `SECTION 3` block showing the
   `arm_data.collections.new()` and `bone.collections.link()` calls.
3. Highlight the audit table block at the bottom.
4. End recording.

## File Output

Place `screen.mp4` at:
```
public/library/videos/scripting/
  python-armature-bone-collections-vrm-rig-classification-webxr/
    screen.mp4
```

alongside `viewport.mp4` produced by `record.py`.
