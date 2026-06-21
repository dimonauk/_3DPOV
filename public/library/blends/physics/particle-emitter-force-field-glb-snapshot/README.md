# Particle System Emitter — Turbulence Force Field, Face Emission & Depsgraph GLB Snapshot

**Blender 5.1 | Physics | CC0**

Fire 300 icosphere shards from a torus emitter via Newtonian physics.
A Turbulence force field bends trajectories into organic arcs.
At frame 35 the evaluated depsgraph yields alive particle positions and quaternion
rotations; `blueprint.py` places real mesh copies there, joins them into a single
object, and exports a studio-ready GLB.

## Technique summary

| Parameter | Value | Rationale |
|---|---|---|
| `pset.type` | `'EMITTER'` | time-windowed burst, not static distribution |
| `pset.emit_from` | `'FACE'` | surface-area-weighted; torus gives even spread |
| `pset.lifetime_random` | `0.35` | ±35 % stagger; avoids synchronised pop-out |
| `pset.render_type` | `'OBJECT'` | 3-D shard instances, not billboard sprites |
| `field.type` | `'TURBULENCE'` | spatially varying noise velocity field |
| `SNAPSHOT_FRAME` | `35` | burst dispersed, turbulence visible, all shards alive |

## Key API notes

- `obj.modifiers.new("name", 'PARTICLE_SYSTEM')` creates both modifier and
  `ParticleSystem` — no `bpy.ops.object.particle_system_add()` needed headlessly.
- Particle positions live only on the *evaluated* depsgraph object:
  `emitter.evaluated_get(dg).particle_systems[0]`.
- `p.rotation` is a `mathutils.Quaternion` (WXYZ). Assign via
  `obj.rotation_mode = 'QUATERNION'` then `obj.rotation_quaternion = p.rotation`.
  Never convert to Euler — gimbal lock mangles fast-tumbling shards.
- `bpy.ops.object.duplicates_make_real()` silently no-ops headless; use the
  explicit copy-place-join pattern in `blueprint.py` instead.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Headless bpy script — builds scene, runs physics, exports GLB |
| `record.py` | EEVEE animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest with cross-reference map |
| `particle_shard_burst.blend` | Generated on run |
| `particle_shard_burst.glb` | Studio GLB — identity transform, Y-up, Draco 6 |

## Run

```bash
# headless — generates .blend and .glb
blender --background --python blueprint.py

# inside Blender
# Scripting workspace → Open blueprint.py → Run Script (Alt+P)
```

## Tutorial page

`/tutorials/blender-tutorial-particle-emitter-force-field-glb-snapshot`
