# Screen Recording Notes — Action Constraint Expression Dial

**Goal**: capture Blender viewport as you rotate the CTRL_expression bone from neutral to full happy and back.

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output | `screen.mp4` |
| Codec | H.264, CRF 18 |

## Scene Layout Before Recording

1. Run `blueprint.py` in the Scripting workspace.
2. Switch to **Layout** workspace.
3. Select `rig_face_expr` → enter **Pose Mode**.
4. Select `CTRL_expression` (the bone above the head).
5. Split the viewport: left side = front orthographic, right side = perspective.
6. In the Properties panel (N-key) → Item tab, pin the Y Rotation field so it is visible on screen.

## Take 1 — Manual Dial Demo (screen.mp4)

1. Start recording.
2. With `CTRL_expression` selected in Pose Mode, slowly rotate it on Y from **0° → 45°** over about 3 seconds. Use `R Y` then drag or type the value.
3. Hold at peak (45°) for 1 second so the viewer can see the full expression.
4. Rotate back to **0°** over 2 seconds.
5. Stop recording.

## Take 2 — Timeline Playback (optional, for tutorial B-roll)

1. Run `record.py` to bake the sweep onto the CTRL bone.
2. Press **Spacebar** to play. Record the viewport playback for the full 90-frame sweep.
3. Stop recording.
4. Rename output to `screen_playback.mp4`.

## File Destinations

```
public/library/videos/rigging/rigging-action-constraint-expression-dial-vrm/
├── viewport.mp4       ← rendered by record.py
└── screen.mp4         ← your OBS capture from Take 1
```

## Tips

- In Pose Mode, turn on **X-Ray** (Alt-Z) so the mesh and bones are both visible.
- Increase bone display size: Properties → Object Data → Viewport Display → Display As: B-Bone or Envelope for visual clarity.
- The shape keys update in real time as you rotate the bone — this is the key moment to show clearly.
