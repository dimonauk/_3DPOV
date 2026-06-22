# Screen Recording Notes — Rigid Body Constraints

Target file: `public/library/videos/physics/physics-rigid-body-constraints-hinge-spring-motor/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (any workspace) |
| Capture mode | Window capture |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no system audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps |

## What to record

1. **Open the blend** — `File → Open → constraints_demo.blend`.
2. **Show the three setpieces** — orbit the viewport to frame all three (door, pendulum, chassis).
3. **Constraint panel walkthrough** (30 s) — click the HingePivot Empty → Properties → Physics → Rigid Body Constraint. Pan over the Type, Object1/2 fields, angular limits.
4. **Hit play** (Space) — let the simulation run for at least 5 seconds (120 frames).  The door should swing open and hit its 90° limit, the pendulum should rotate continuously, and the chassis should bob vertically.
5. **Pause at frame 60** — show the Spreadsheet or Properties panel with the constraint active.
6. **Bake to keyframes** (optional, for animated GLB demo) — `Object → Rigid Body → Bake to Keyframes…`, range 1–120, then show the resulting location/rotation keyframes on the Timeline.

## Common issues

- **Simulation explodes at frame 1**: Constraint Empty is inside one of the rigid bodies — move it to the joint axis first, then re-run.
- **Motor does nothing**: `motor_ang_max_impulse` is too low for the attached mass.  Raise it until the pendulum moves.
- **Spring doesn't oscillate**: `spring_damping_z` > 1 — Bullet's ratio above 1 = over-damped.
- **Bake fails**: Scene must have at least one Active rigid body with simulation enabled; passive-only scenes have no cache to bake.
