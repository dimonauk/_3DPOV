# Shape Keys & Morph Targets for VRM Facial Expressions
**Blender 5.1 · CC0 · Holoflow Studio**

Shape keys store a second (or third, or tenth) set of vertex positions on a
mesh.  In glTF they become morph targets — the runtime linearly interpolates
between the rest pose and each expression, in real time, at any blend weight
between 0 and 1.  VRM 1.0 wraps that system in a named expression schema
(`happy`, `angry`, `blink`, phonemes) so runtimes know which morph to drive
from face tracking or emotion inputs.

## Outputs

| File | Description |
|---|---|
| `face_vrm.blend` | Stylised face proxy with six shape keys and cel-shade material |
| `face_vrm.glb` | GLB with embedded morph targets — no Draco (spec incompatibility) |

## Key technique decisions

**Position-based zone selection** (`zone()` helper in blueprint.py): vertex
indices are selected by world-space bounding box rather than hard-coded index
lists.  This survives topology changes between Blender patch releases and works
correctly regardless of the sphere seam vertex ordering.

**`from_mix=False` on every expression key**: each key starts from the Basis
rest pose, not from whatever the current slider mix is.  This is what glTF
morph targets assume — each target is an independent offset from rest.  Using
`from_mix=True` stacks keys, producing wrong results when multiple expressions
are blended simultaneously.

**No Draco compression**: the glTF 2.0 spec's `KHR_draco_mesh_compression`
extension does not support `KHR_mesh_morph_targets`.  Enabling both produces a
file that either fails to load or silently drops the morph targets.  Meshes
with morph targets should be compressed at the transport layer (gzip/brotli)
instead.

**`export_apply=False`**: Blender cannot apply modifiers to a mesh that has
shape keys.  The GLB exporter handles this correctly when `export_apply=False`
— it reads the mesh data directly without trying to apply the modifier stack.

## VRM expression name convention (Fcl_*)

Blueprint uses the `Fcl_` prefix from AliciaSolid's reference face mesh, which
the VRM-Blender-IO add-on maps to VRM 1.0 expression presets:

| Shape key | VRM 1.0 expression |
|---|---|
| `Fcl_EYE_Close_L` | `blinkLeft` |
| `Fcl_EYE_Close_R` | `blinkRight` |
| `Fcl_ALL_Joy` | `happy` |
| `Fcl_ALL_Angry` | `angry` |
| `Fcl_MTH_A` | `aa` (phoneme) |

## Running headless

```bash
# Step 1 — build the mesh + keys + GLB
blender --background --python blueprint.py

# Step 2 — render the expression animation
blender --background face_vrm.blend --python record.py
```

## Licence
CC0 — no rights reserved.  Outside references credited in the tutorial at
`/tutorials/blender-tutorial-shape-keys-morph-targets`.
