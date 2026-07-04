# Python bpy.types.Armature — EditBone Chain: Procedural VRM Spine Skeleton

**Blender 5.1 · CC0 · Holoflow Studio**

Builds a nine-bone VRM 1.0 humanoid torso skeleton entirely from Python, parents a
cylinder body proxy with automatic envelope weights, and exports a GLB with embedded
skinning data. The core lesson is the **EditBone API boundary**: bone head/tail/roll
can only be set in EDIT mode; once you switch back to OBJECT mode, the geometry is
frozen into read-only `bpy.types.Bone` objects.

## What this tutorial covers

| Concept | Detail |
|---|---|
| `arm.edit_bones.new()` | creates an EditBone — only valid while armature is in EDIT mode |
| `bone.head / tail / roll` | geometry definition — cannot be changed after mode exit |
| `bone.parent / use_connect` | hierarchy + chain topology |
| Bone Collections (4.0+) | `arm.collections.new()` replaces the 32-layer bitmask |
| Custom bone shapes | `pb.custom_shape = widget_obj` for hexagon display rings |
| `parent_set(ARMATURE_AUTO)` | Automatic Weights via heat-diffusion envelope |
| GLB with skinning | `export_skins=True` in `bpy.ops.export_scene.gltf()` |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Build scene + armature + body proxy + GLB export |
| `record.py` | 48-frame viewport animation showing spine bow deformation |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `vrm_spine_skeleton.glb` | Skinned GLB (run blueprint.py to generate) |

## Prerequisites

- Blender 5.1 (Bone Collections API requires 4.0+)
- No external add-ons required

## Quick run

```bash
blender --background --python blueprint.py
# opens Blender, builds scene, exports vrm_spine_skeleton.glb, closes
```

## VRM bone names

This build uses VRM 1.0 camelCase names (`hips`, `spine`, `chest`, `upperChest`,
`neck`, `head`, `leftShoulder`, `rightShoulder`). The VRM add-on (MIT, vrm-c)
recognises these automatically when exporting `.vrm` from the generated `.blend`.
