# Surface Deform — Bind Accessories & Cloth to a VRM Character Mesh

**Blender 5.1 · Modifiers · CC0**

Demonstrates the Surface Deform modifier binding workflow: a tunic mesh is
permanently tied to a subdivided body torso at rest, then follows all body
deformation — armature poses, shape keys, cloth sim — without sliding across
surface seams.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Production script — builds body, garment, armature, binds, animates, exports GLB |
| `record.py` | Standalone render script — outputs `viewport.mp4` (60 frames, 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |

## Outputs (run blueprint.py)

- `vrm_cloth_binding.glb` — rest-pose snapshot of body + bound garment, Draco + WebP
- `vrm_cloth_binding.blend` — save the .blend after running to preserve the live modifier stack

## Key technique

Surface Deform projects each garment vertex onto the nearest triangle of the
target body mesh at bind time, recording barycentric coordinates.  From that
point, the vertex rides that triangle forever — following it through any
deformation without re-projection.

Contrast with Shrinkwrap, which re-projects every frame and causes sliding.

## Bind resolution

```
Body cylinder base  →  12 sides × 16 rings  =  192 quads
After SubD level 2  →  48 sides × 64 rings  =  3 072 quads
Maximum bind gap    ≈  BODY_CIRCUMFERENCE / 48  ≈  0.03 m
```

Higher SubD levels give smaller gaps and smoother garment deformation, at the
cost of more memory and slower bind time.

## GLB export note

`export_apply=True` in the glTF operator applies Surface Deform on the exported
copy without destroying the live modifier.  This outputs a static garment shaped
to the current frame.  For a fully rigged garment export (garment moves with the
skeleton in Three.js), apply Surface Deform to bake rest-pose vertex positions,
then add an Armature modifier and transfer vertex group weights from the body
using the Data Transfer modifier.

## Blender 5.1 compatibility notes

- `bpy.ops.object.surfacedeform_bind(modifier=mod.name)` — available since 2.82.
- `bpy.context.temp_override(active_object=obj)` — available since 3.2; required
  for headless bind without a viewport context.
- `mod.is_bound` — read-only bool indicating a successful bind.
- `mod.falloff` — float exponent (default 4.0); higher = harder cutoff at mesh boundary.
- `mod.strength` — 0.0 = no deformation, 1.0 = full follow.

## Tutorial

`/tutorials/blender-tutorial-modifier-surface-deform-vrm-cloth-binding`
