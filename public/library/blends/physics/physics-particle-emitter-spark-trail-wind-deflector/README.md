# Particle System Emitter — Spark Trail with Wind Force + Deflector Collision

**Blender 5.1 · Physics · CC0**

500 Newtonian particles emitted from a small plane at Z=3, shaped as elongated
ember shards (OBJECT render type), blown sideways by a Wind force field and
twisted by a Vortex, deflecting off a sphere obstacle and a tilted ground plane.

## Quick start

1. Open Blender 5.1 with a fresh default scene.
2. Scripting workspace → open `blueprint.py` → **Run Script**.
3. **Physics ▸ Bake All Dynamics** (or Cache panel → Bake).
4. Scrub the timeline. Hero frame ≈ 55.
5. Run `record.py` then **Render ▸ Render Animation** for `viewport.mp4`.
6. Follow `SCREEN-RECORDING-NOTES.md` to capture `screen.mp4`.

## What this teaches

- `ParticleSettings.physics_type = 'NEWTON'` — Newtonian spring-mass integrator
- `effector_weights` block — per-system force field attenuation
- `render_type = 'OBJECT'` + `instance_object` — shape-per-particle instancing
- `rotation_mode = 'VEL'` — long axis aligned to velocity direction
- `Collision` modifier on arbitrary mesh — `thickness_outer`, `damping_factor`, `friction_factor`
- Wind effector `-Z` direction convention and `noise` turbulence layer
- Vortex `flow` parameter as air-resistance drag

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the full scene programmatically — run once |
| `record.py` | Configures EEVEE render output for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `spark_trail.blend` | Saved .blend after baking (created by Dimona) |

## Adapting this scene

- **Swap instance object**: replace `spark_instance` with any mesh (leaf, debris
  shard, snow flake). The `rotation_mode='VEL'` keeps the long axis aligned to
  flight direction.
- **More turbulence**: increase `WIND_NOISE` from 0.8 toward 1.5 for chaotic
  gusts. Values >2.0 make particles orbit unpredictably.
- **Fountain effect**: remove the Wind effector and increase `NORMAL_VEL` to
  8.0 — particles arc ballistically and fall back under gravity.
- **Sticky sparks**: raise `friction_factor` on the ground Collision modifier to
  1.5 — particles nearly stop on first contact, building a ground accumulation.
- **Export**: after baking, jump to frame 55, apply the particle modifier
  (`Ctrl+A → Visual Geometry to Mesh`) and export as GLB for a single static
  burst frame.

## Related tutorials

- `/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag` — same Wind
  effector and Collision modifier, different physics system
- `/tutorials/blender-tutorial-physics-mantaflow-smoke-fire-torch` — Mantaflow
  uses its own built-in flow solver rather than effector objects
- `/tutorials/blender-tutorial-gn-simulate-zone-wave-reveal` — GN Simulation
  Zone as the modern alternative for complex per-vertex behaviours
