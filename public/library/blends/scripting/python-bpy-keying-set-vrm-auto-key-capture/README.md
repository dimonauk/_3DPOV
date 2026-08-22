# Python bpy.types.KeyingSet + KeyingSetInfo — VRM Auto-Key Capture Pipeline

**Blender 5.1 · Python · CC0 · Holoflow Studio**

Demonstrates both creation routes for custom keying sets — scene-level static
paths and a registered `KeyingSetInfo` subclass — then uses the paths collection
to batch-insert keyframes across a mixed bone + expression + rig-dial timeline,
exporting a GLB with animation ready for three-vrm WebXR playback.

## What you get

| Artefact | Purpose |
|---|---|
| `keying_set_vrm_capture.glb` | GLB with bone animation + morph targets (Draco + WebP) |
| `keying_set_vrm_capture.blend` | Source scene with keying set persisted on the scene |
| `blueprint.py` | Full production script |
| `record.py` | Viewport animation renderer |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |

## Running

```bash
# Fresh run — creates .blend + .glb
blender --background --python blueprint.py

# Viewport animation render (run after blueprint)
blender keying_set_vrm_capture.blend --background --python record.py
```

## Key concepts

- `scene.keying_sets.new(idname, name)` — static keying set on the scene block
- `ks.paths.add(id, data_path, index, group_method, group_name)` — channel path
- Shape key paths: pass the `Key` block as `id`, not the Object
- `KeyingSetInfo` subclass + `bpy.utils.register_class()` — dynamic registered type
- `generate(self, context, ks, data)` — live enumeration called at every I-press
- Headless insertion: `ksp.id.keyframe_insert(data_path=..., index=..., frame=f)`
- `'INSERTKEY_NEEDED'` flag — sparse capture, skips unchanged channels

## three-vrm WebXR usage

```js
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
// After VRM load, drive expressions from the animation clip:
mixer.clipAction(clip).play()
// Or manually:
vrm.expressionManager.setValue('happy', 0.8)
vrm.expressionManager.update()
```

## Licence

Blueprint, macro, and all outputs: CC0. Outside references credited in tutorial.
