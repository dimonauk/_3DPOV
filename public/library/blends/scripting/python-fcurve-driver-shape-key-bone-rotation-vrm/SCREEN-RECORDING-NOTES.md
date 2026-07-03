# SCREEN-RECORDING-NOTES — Driver / Shape Key Corrective

**Output file:** `public/library/videos/scripting/python-fcurve-driver-shape-key-bone-rotation-vrm/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent tutorial) |
| Output | MP4, H.264 High, ~8 Mbps |

## What to record (approx. 90 seconds)

### Part 1 — Graph Editor: driver anatomy (0-25 s)
1. Open `elbow_corrective_rig.blend`.
2. Switch one viewport to **Graph Editor** → change mode to **Drivers** (top-left dropdown).
3. Select the mesh `elbow_skin` in the Outliner.  The driver FCurve for
   `elbow_corrective` value should appear as a horizontal line (baked to keyframes).
4. Show the expression string in the Properties sidebar (N-panel) → Driver section.
   Point out: `max(0.0, min(1.0, (bend - -0.2) / (-1.5708 - -0.2)))`.

### Part 2 — Live scrub in 3D Viewport (25-55 s)
5. Switch back to 3D Viewport + Timeline.
6. Drag the playhead slowly from **frame 1 to frame 30**.
   The forearm rotates and the shape key bulge appears at the elbow crease.
7. Pause at frame 15 (mid-bend) and pause at frame 30 (full bend) to show both states.
8. Open the **N-panel → Shape Keys** on the mesh to show the elbow_corrective slider moving.

### Part 3 — Python driver creation code (55-75 s)
9. Open the **Scripting workspace**.
10. Show the `build_driver()` function from `blueprint.py`.
    Highlight:
    - `key_id.driver_add(f'key_blocks["{SK_NAME}"].value')` — targeting the Key block
    - `var.type = 'TRANSFORMS'` + `tgt.transform_space = 'LOCAL_SPACE'`
    - The expression string being built dynamically from constants

### Part 4 — Export (75-90 s)
11. File → Export → glTF 2.0.
12. Enable **Morph Targets** (Shape Keys) in the Data tab.
13. Enable **Apply Modifiers** OFF (keep armature), **Animations** ON.
14. Show resulting `.glb` in a file browser — morph target + animation in one file.

## Tips
- Set **Viewport Shading** to **Material Preview** so the mesh colour shows clearly.
- Disable `Overlays → Bone Names` to reduce clutter during shape key scrub.
- Use `Alt+A` to play back the full animation after recording the scrub portion.
- `Ctrl+Alt+Q` for quad-view if you want side + front simultaneously.
