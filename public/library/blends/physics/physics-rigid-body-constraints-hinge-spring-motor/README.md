# Rigid Body Constraints — Hinge, Motor & Generic Spring (Blender 5.1)

Three Bullet constraint patterns in one scene: a hinged door with angular
limits, a motor-driven pendulum, and a spring-suspended chassis.  Each is
driven entirely by the Bullet PGS solver — no keyframes, no drivers.

## What's in the folder

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build script — run in background or Script workspace |
| `record.py` | EEVEE animation render to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# Build scene + rest-pose GLB
blender --background --python blueprint.py

# Render viewport animation (requires constraints_demo.blend)
blender --background constraints_demo.blend --python record.py
```

## Key concepts

**Constraint pivot placement** — the world transform of the constraint Empty
defines the pivot frame.  For HINGE, the rotation axis is the Empty's local Z.
Place the Empty exactly at the physical joint location before adding the
constraint; repositioning afterwards does not retroactively update the solver.

**bpy.ops vs direct API** — `bpy.ops.rigidbody.constraint_add(type=...)` is
mandatory: there is no `bpy.data` path that creates the `rigid_body_constraint`
property.  Unlike modifiers, the constraint subsystem requires the operator's
world-registration side-effect.

**Motor impulse cap** — `motor_ang_max_impulse` limits the per-sub-step torque
delivered by the motor.  Too low: stalls under gravity.  Too high: velocity
snap causes constraint explosion on frame 1.  Start at `5 × mass × radius`.

**GENERIC_SPRING damping** — `spring_damping_z` is a dimensionless ratio, NOT
Ns/m.  Values 0–1 give under-damped oscillation; exactly 1 gives critical
damping; above 1 gives over-damped (no oscillation).  The physical critical
damping coefficient is `2 × sqrt(spring_stiffness × mass)`.

## Troubleshooting

- **Constraint explosion**: pivot Empty is inside a body mesh; move it out.
- **Door doesn't stop at limit**: `limit_ang_z_upper` must be in radians, not degrees.
- **Spring doesn't bounce**: `use_limit_lin_z = True` prevents free Z travel — must be `False` for the sprung axis.
- **GLB export missing simulation**: run `Object → Rigid Body → Bake to Keyframes` first; the glTF exporter reads keyframe channels, not the point cache.

## Licence

CC0 1.0 — no rights reserved.
