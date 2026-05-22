# Animation Drivers — Custom Properties Controlling Shader Sockets

**Blender 5.1 | Holoflow Studio | CC0**

A faceted crystal shard whose emission intensity and shader blend factor are
both controlled by a single `energy_level` Custom Property on the object.
Setting one slider in the UI — or one keyframe in the timeline — drives the
entire visual transition from dormant dark to full cyan glow.

## Contents

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene, crystal mesh, material, custom property, drivers, keyframes, exports GLB |
| `record.py` | Renders 5-second pulse animation to `viewport.mp4` (run after blueprint.py or standalone) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Output manifest |

## Quick start

```bash
# Build the scene and export GLB (peak glow state)
blender --background --python blueprint.py

# Render the viewport animation
blender crystal_shard.blend --python record.py
```

## Expert notes

- Driver type is `SCRIPTED` with expression `"energy * 4.0"` for Emission
  Strength. Variable `energy` reads `obj["energy_level"]`.
- `tgt.id_type = 'OBJECT'` is mandatory — omitting it silently resolves the
  wrong datablock and the driver returns 0.
- `bpy.context.view_layer.update()` is called before export to propagate the
  driver value through the depsgraph.
- Custom property animation (`obj.keyframe_insert(data_path='["energy_level"]')`)
  does **not** export to standard glTF channels. For animated WebXR delivery,
  use `KHR_animation_pointer` (Blender 5.x export UI) or convert to a shape
  key weight (which exports as a morph target).

## Output

- `crystal_shard.glb` — Draco-compressed GLB, static snapshot at peak glow
- `viewport.mp4` — 150-frame pulse animation rendered via EEVEE Next
- `screen.mp4` — OBS screen capture (pending — see SCREEN-RECORDING-NOTES.md)

## Licence

Blueprint and record scripts: **CC0 / public domain**.  
Blender Manual reference: CC-BY-SA 4.0 (Blender Foundation contributors).  
glTF KHR_animation_pointer spec: Apache-2.0 (Khronos Group).
