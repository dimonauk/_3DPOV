# Python bpy.types.Key + ShapeKey — VRM Morph Target Construction

**Blender 5.1 · Python · CC0 · Holoflow Studio**

Builds eight VRM 1.0 expression shape keys on a UV-sphere head proxy
using `foreach_set` for bulk vertex writes, then exports a GLB with morph
targets ready for `three-vrm` WebXR playback.

## What you get

| Artefact | Purpose |
|---|---|
| `vrm_morph_proxy.glb` | GLB with 8 glTF morph targets (Draco + WebP) |
| `vrm_morph_proxy.blend` | Source scene with Key data-block |
| `blueprint.py` | Full production script |
| `record.py` | Viewport animation renderer |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |

## Running

```bash
# Fresh run — creates .blend + .glb
blender --background --python blueprint.py

# Viewport animation render (run after blueprint)
blender vrm_morph_proxy.blend --background --python record.py
```

## Key concepts

- `mesh.shape_keys` → `bpy.types.Key` (created on first `ob.shape_key_add()`)
- `key.key_blocks[0]` is always the Basis
- `sk.data.foreach_set('co', flat)` bulk-writes 3*N floats in one C call
- VRM expression preset names: `happy`, `angry`, `sad`, `surprised`,
  `blink`, `blinkLeft`, `blinkRight`, `aa`
- `export_morph=True`, `export_morph_normal=True`, `export_morph_tangent=False`

## three-vrm WebXR usage

```js
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
// After VRM load:
vrm.expressionManager.setValue('happy', 0.8)
vrm.expressionManager.setValue('blinkLeft', 1.0)
vrm.expressionManager.update()
```

## Licence

Blueprint and all outputs: CC0. Outside references credited in tutorial.
