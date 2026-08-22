# Screen Recording Notes — IK-to-FK Bake Pipeline
## OBS / Windows Game Bar Instructions

### Setup

- **Window source**: Blender 5.1 (windowed, not full-screen)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: disabled (no commentary track needed for this clip)
- **Output file**: `public/library/videos/scripting/python-nla-bake-ik-fk-action-push/screen.mp4`

### Workspace Layout Before Recording

Arrange Blender with a 3-panel layout:

| Panel | Content |
|-------|---------|
| **Left 60 %** | 3D Viewport (solid shading, overlays ON, bone display = Stick) |
| **Top-right** | Scripting workspace / Text Editor with `blueprint.py` open |
| **Bottom-right** | NLA Editor (so the viewer sees the strip appear after bake) |

Set viewport shading to **Solid** with **Colour = Object** so each bone gets a distinct colour — clearer for tutorial viewers than the default grey.

### Shot List

1. **(0:00–0:20)** Pan/orbit the 3D viewport to show the 3-bone IK arm at rest. Press **Space** to play — the IK target moves in its arc and the arm follows. Let it loop twice.

2. **(0:20–0:45)** Switch focus to the Text Editor. Scroll through `blueprint.py`, pausing briefly on:
   - The `bake_ik_to_fk()` function header
   - The `visual_keying=True` line (hover or highlight)
   - The `clear_constraints=True` line

3. **(0:45–1:20)** With playback stopped at frame 1, press **Run Script** (▶ in the Text Editor header). The Script Console (Info Editor) should log `[HOLOFLOW] Baked N F-curves → 'arm_ik_baked_fk'`. Pan down to the NLA Editor — the new strip `arm_ik_baked_fk` should appear on the `ik_arm` track.

4. **(1:20–1:40)** Back in the 3D Viewport, press **Space** again. The arm now animates via FK keyframes (no IK constraint visible in the Properties panel → Bone Constraints). Orbit to show the same arc from a different angle.

5. **(1:40–2:00)** Open the Dope Sheet (switch one panel to **Dope Sheet → Action Editor**), select the `arm_ik_baked_fk` action, and scrub through it. The keyframe diamonds should appear on `upper_arm` and `forearm` rotation channels on every frame.

### Post-Production Notes

- Trim the clip to ≤ 2 minutes.
- Add a lower-third text card at (0:45): **"Running blueprint.py…"**
- Add a lower-third text card at (1:20): **"IK constraint removed — FK keyframes active"**
- Colour grade: slight warm push (+5 K), mild vignette. No dramatic grading needed.
- Export H.264, CRF 18, 1920 × 1080 → `screen.mp4`.
