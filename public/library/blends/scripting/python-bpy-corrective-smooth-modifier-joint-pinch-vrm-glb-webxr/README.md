# CorrectiveSmoothModifier — Joint Pinch Mitigation for VRM Arms
## Blender 5.1 · Python API · CC0

**Technique:** `bpy.types.CorrectiveSmoothModifier` sits immediately after the
`Armature` modifier in the stack and smooths deformed geometry back toward its
rest shape each frame. The effect is scoped to the elbow zone via a gradient
vertex group so the stable shoulder and wrist hulls are completely untouched.

This is the production fix for the pinch bulge that appears at elbow and knee
joints on VRM characters — no shape keys required, no corrective blend shapes,
no secondary rig.

## ORCO vs BIND

| Mode | Rest reference | When to use |
|------|----------------|-------------|
| `ORCO` | mesh.vertices[i].co in object space (T-pose) | Standard VRM: T-pose == mesh rest |
| `BIND` | explicit bind captured via operator | Custom rest pose, not T-pose |

For standard VRM rigs use `ORCO`. No bind operator call needed.

## Stack Order

```
Armature          ← skinning deformation
CorrectiveSmooth  ← pinch correction on the deformed result
```

Placing `CorrectiveSmooth` before `Armature` causes zero effect — the modifier
would read un-deformed rest geometry where no pinching exists yet.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build arm tube + rig + CS modifier, export GLB |
| `record.py` | OpenGL viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_corrective_smooth_arm.blend` | Live scene with animated pose |
| `hf_corrective_smooth_arm.glb` | Rest-pose export, modifier stack baked |

## How to Run

```bash
blender --background --python blueprint.py
# then for the viewport recording:
blender --background hf_corrective_smooth_arm.blend --python record.py
```

Or open Blender → Text Editor → paste script → Run Script.

## Key Parameters

```python
cs.rest_source    = 'ORCO'             # T-pose as rest reference
cs.smooth_type    = 'LENGTH_WEIGHTED'  # volume-preserving neighbour weights
cs.factor         = 0.90               # influence strength [0, 1]
cs.iterations     = 14                 # smoothing passes
cs.vertex_group   = 'elbow_zone'       # gradient mask: 1.0 at pivot, 0.0 at edge
cs.use_only_smooth    = False
cs.use_pin_boundary   = False
cs.scale              = 1.0            # match object world scale
```

## Licence

All files in this directory are released under CC0 (public domain).
https://creativecommons.org/publicdomain/zero/1.0/

## Outside References

1. **bpy.types.CorrectiveSmoothModifier — Blender Python API 5.1**
   CC-BY-SA-4.0 · Blender Foundation
   https://docs.blender.org/api/5.1/bpy.types.CorrectiveSmoothModifier.html

2. **Corrective Smooth Modifier — Blender Manual**
   CC-BY-SA-4.0 · Blender Documentation Team
   https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/corrective_smooth.html

3. **libigl — Laplacian Smoothing Reference**
   MIT · Olga Sorkine-Hornung et al.
   https://libigl.github.io/tutorial/#laplacian-smoothing
   Related: https://github.com/libigl/libigl
