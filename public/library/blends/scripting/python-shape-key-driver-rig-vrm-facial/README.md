# Shape Key Driver Rig — Bone Rotation → Morph Target

**Blender 5.1 · Python scripting · VRM / WebXR pipeline**

## What this does

Wires bone local-rotation channels to shape key values using Blender's
scripted driver system.  Moving a pose bone automatically morphs the
face without touching the shape key slider by hand.

## Why drivers, not keyframes?

Keyframing shape keys works for pre-authored clips, but a driver reacts
in real time: an animator poses the bone and the face updates live in
the viewport.  That interactivity matters during rigging; once you are
happy with the rig, a single bake pass (`bake_sk_drivers()`) converts
the live values to explicit keyframes for GLB export.

## Shape key maths

```
result_vertex = basis_co + Σ (sk.value × delta_co)
```

Shape keys store *deltas* from Basis, not absolute positions.  Blender
applies them additively weighted by their `value` float.  That is why
the Basis key must always be index 0 and value 0.0 — it is the
anchor the deltas pull against.

## Driver architecture

```
Armature / bone → transform_type=ROT_X → local radians
  ↓
variable "rot" in scripted expression
  ↓
clamp(-rot / (π/2), 0.0, 1.0)  →  shape_key.value
```

`half_pi` (π/2) is stored as a scene custom property
(`bpy.context.scene["hp"]`) so the driver expression stays pure
arithmetic — the driver sandbox does not load Python modules.

## Corrective shape keys

`sad_corrective` uses a product-of-clamps expression:

```
max(0.0, -rot_l/hp) * max(0.0, -rot_r/hp)
```

Each factor is 1.0 only when its bone is at −90°.  Their product
reaches 1.0 only when BOTH brows droop simultaneously, giving a
true combo-triggered corrective.

## GLB export and VRM

Blender drivers are evaluated live in the dependency graph; they are
**not** written to the GLB file.  Before export:

1. `bake_sk_drivers()` samples the depsgraph-evaluated shape key value
   on every frame and inserts explicit `value` keyframes.
2. `export_scene.gltf(export_morph=True, export_animations=True)` writes
   the morph targets and their weight animation tracks.

In Three.js:
```js
mesh.morphTargetInfluences[i] = value   // set per frame
```

In VRM 1.0, the `VRMC_vrm.expressions` block maps expression names
(happy, sad, blink…) to shape key weights.  VRM exporters read the
live shape key value — after baking, the exported VRM plays the baked
animation automatically.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full pipeline: mesh → shape keys → armature → drivers → bake → GLB |
| `record.py` | OpenGL viewport animation → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## External references

- [Blender Manual — Shape Key Drivers](https://docs.blender.org/manual/en/latest/animation/shape_keys/drivers.html)
- [VRM 1.0 Specification](https://github.com/vrm-c/vrm-specification) (MIT)
- [glTF 2.0 Morph Targets](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#morph-targets) (Apache-2.0)
