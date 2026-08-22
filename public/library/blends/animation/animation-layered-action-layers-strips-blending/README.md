# Action Layers & Strips — Additive Blending for VRM Idle Animation

**Blender 5.1 · Animation · CC0**  
Slug: `animation-layered-action-layers-strips-blending`

Demonstrates the Blender 5.0+ layered Action architecture: a base REPLACE
layer for idle sway, an additive ADD layer for chest breathing, and a
second ADD layer for a face blink — all inside one `bpy.types.Action`,
ChannelBags authored directly via Python, exported as a single baked
animation track in the GLB.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene + layered action + GLB export |
| `record.py` | EEVEE viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick Start

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Open `blueprint.py` and press **Run Script** (▷).
3. The console prints layer names, blend modes, and confirms GLB export.
4. Switch to the **Animation** workspace; open the Action Editor to inspect
   the three layers.

## Key Concepts

### Action.layers (5.0+ only)

```python
layer = action.layers.new(name="additive_breath")
layer.blend_mode = "ADD"     # REPLACE | ADD | COMBINE | SUBTRACT | MULTIPLY
layer.influence  = 0.8       # 0.0–1.0 envelope weight
```

### ChannelBags

Each Strip holds a ChannelBag per Slot. The ChannelBag owns the FCurves:

```python
strip = layer.strips.new(type="KEYFRAME")
bag   = strip.channelbag_for_slot(slot)
fc    = bag.fcurves.new(data_path='pose.bones["ribcage"].scale', index=2)
fc.keyframe_points.insert(frame=0.0, value=0.0)
```

### GLB export note

`export_scene.gltf(export_nla_strips=False)` bakes the evaluated (fully
composited) animation — all layers — into one `AnimationClip` named after
the Action. Three.js `AnimationMixer` picks this up automatically.

## Holoflow Studio hook

`tools/blender-addon/holoflow_macros/animation_layered_action.py` exposes
`build_additive_layer(action, slot, blend_mode, fcurve_data)` as a reusable
helper for adding any additive channel to an existing action from the
Holoflow export pipeline.
