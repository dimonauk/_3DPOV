# Python bpy.types.ParticleSystem — Emitter + Hair Instance Scatter (Blender 5.1)

**Slug**: `python-bpy-particle-system-emitter-hair-instance-webxr`  
**Category**: scripting  
**Blender**: 5.1  
**Licence**: CC0 (original code)

## What This Does

Builds two particle systems entirely via the Python data API — no operators, no active-context dependency:

1. **Emitter system** — 120 copies of an icosphere scattered across a subdivided plane face-distribution, captured via `dg.object_instances` and stored as a Named Attribute on a point-cloud mesh.
2. **Hair system** — 200 PATH-rendered strands on a second plane, with animated `path_end` reveal for the recording.

## Why the Data API Over bpy.ops

`bpy.ops.object.particle_system_add()` requires an active context object and will silently fail in headless or background Python sessions. `ob.modifiers.new("Name", "PARTICLE_SYSTEM")` always works because it operates on the data-block directly.

## Blender 5.1 Migration Context

In Blender 5.1, the preferred approach for static object scatter is **Geometry Nodes → Instance on Points**, and for hair/fur it is **GN Curves → Hair Curves**. Particle systems remain the right choice when you need:

- Dynamics: Newtonian physics, rigid body + particle interaction
- Mantaflow coupling: particles as fluid, fire, or smoke emitters
- Legacy asset pipelines that predate GN hair

`blueprint.py` documents the migration path inside the `_add_hair_psys()` docstring.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full expert bpy scene build; run in Blender Script Editor |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```
# In Blender 5.1 Script Editor
# Open blueprint.py → Run Script (Alt-P)
# Scene: ParticleDemo collection, two planes + inst_gem + captured_positions
```

## Cross-References

- [GN Instance on Points (modern scatter)](/tutorials/blender-tutorial-gn-instance-on-points)
- [GN Distribute Points on Faces — Poisson Scatter](/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter)
- [Python Depsgraph Evaluated Geometry — Batch GLB Export](/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export)
- [Python Depsgraph Object Instances — GN Scatter GLB](/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export)
