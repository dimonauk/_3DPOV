# Screen Recording Notes — GN Rotation Nodes FK Robot Arm

Target file: `public/library/videos/geometry-nodes/gn-rotation-nodes-axis-angle-fk-robot-arm/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Scene | Blender Viewport |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 / CRF 18 |

## What to Record (approx. 10–14 minutes)

### Part 1 — The Problem with Euler Rotation (2 min)

1. Open a new Blender file. Add a Geometry Nodes modifier to a Cube.
2. Wire: `CombineXYZ(0, 45°, 0)` → `TransformGeometry.Rotation`.
3. Then add a second `CombineXYZ(0, 0, 45°)` and try to pipe it through to
   rotate the result further. Show that you can't simply add two Euler vectors:
   combining them produces wrong results (order-dependent, gimbal at ±90°).
4. Verbalise: "Euler triplets are convenient for one rotation. They break the
   moment you want to chain two — you need to convert to quaternion, multiply,
   and convert back. The Rotation socket type in Blender 4.2+ does that for you."

### Part 2 — Rotation Math Node Tour (3 min)

1. Open Add → Utilities → Rotation in the GN editor.
2. Walk through the nodes available:
   - `Axis Angle to Rotation` — show the Axis + Angle inputs, Rotation output
   - `Euler to Rotation` — the bridge from old-style CombineXYZ workflows
   - `Rotate Rotation` — the FK composer; show the Rotation Space enum
   - `Rotate Vector` — show that it takes a Rotation (not Euler) on the second socket
3. Emphasise: "Notice these nodes all have orange ROTATION sockets, not the old
   purple VECTOR sockets. Orange means quaternion-backed — no gimbal lock."

### Part 3 — Build the FK Chain (6–8 min)

Work through blueprint.py order:

1. **Group Input** → Yaw, Pitch, Roll Float sockets. Drag defaults to see
   slider clamping (Pitch locked −90→+90).
2. **Math(Multiply, DEG2RAD)** × 3 — explain why degrees in the UI but radians
   in nodes (all trig nodes in Blender use radians).
3. **AxisAngleToRotation** × 3 — set Axis defaults: Z for yaw, Y for pitch,
   X for roll. Wire angle inputs.
4. **RotateRotation(LOCAL)** for yaw+pitch — drag Rotation Space to LOCAL.
   Show GLOBAL vs LOCAL: in GLOBAL, pitch bends in world Y regardless of yaw;
   in LOCAL, it bends in the yaw-rotated local Y. That's FK.
5. **RotateRotation(LOCAL)** for +roll — compose wrist roll.
6. **RotateVector** for elbow position — "This is the key insight: the elbow
   isn't just at (0,0,BASE_H + LOWER_ARM_L). After yaw+pitch, (0,0,LOWER_ARM_L)
   maps to a different world vector. RotateVector does that mapping."
7. **VectorMath(ADD)** to add elbow offset to shoulder position.
8. Repeat for wrist and gripper positions.
9. **TransformGeometry** for each arm segment — show that Rotation socket
   now accepts the orange Rotation type directly.

### Part 4 — Animate and Show (2 min)

1. In the modifier properties panel, drag the Yaw slider: base column stays
   fixed, entire arm above rotates. ✓
2. Drag Pitch to 70°: arm folds forward (upper assembly tilts). ✓
3. Drag Roll to 90°: gripper spins around the arm's last segment. ✓
4. Set Pitch to 90°, then vary Yaw: demonstrate gimbal-lock is absent —
   the arm bends cleanly at 90° with no flip or singularity.

### Part 5 — Export (1 min)

1. File → Export → glTF 2.0.
2. Enable Apply Modifiers, Draco level 6, Y-up, snake_case root.
3. Load in a WebXR viewer; note that the GLB captures the baked static pose.

## Editing Notes

- Title card: "GN Rotation Nodes — FK Robot Arm | Blender 5.1 | Holoflow Studio"
- Highlight the Rotation Space enum change (LOCAL vs GLOBAL) with a zoom cut.
- Cut the initial Euler-failure demo before the correct take.
- Export 1920 × 1080, H.264, CRF 18, no audio track.
