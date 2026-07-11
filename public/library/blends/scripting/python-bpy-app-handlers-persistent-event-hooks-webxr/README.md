# bpy.app.handlers — Persistent Event Hooks: Reactive WebXR Export Pipeline

**Blender 5.1 · CC0 · holoflow.co.uk**

`bpy.app.handlers` exposes typed Python callable lists fired at Blender lifecycle
events. The `@persistent` decorator retains handlers across `.blend` file loads.
Four pipelines wired in this blueprint: VAT sampler, light watcher, GLB
auto-exporter, and load-post bootstrap.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full reactive pipeline — register once, runs forever |
| `record.py` | Viewport animation renderer (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `light_rig.json` | Written reactively by `depsgraph_update_post` |
| `vat_samples.json` | Built during timeline playback by `frame_change_post` |

## Artefacts Produced

- `light_rig.json` — live light state snapshot
- `vat_samples.json` — vertex position samples per frame
- `handlers_demo.glb` → `public/library/glbs/scripting/handlers-demo/`
- `viewport.mp4` → `public/library/videos/scripting/<slug>/`
- `screen.mp4` → same folder, from OBS screen capture

## Key API Points

| Concept | Notes |
|---------|-------|
| `@bpy.app.handlers.persistent` | Sets C-level flag; handler survives file open |
| `frame_change_post(scene, depsgraph)` | Post-evaluation; depsgraph arg added in 4.x |
| `depsgraph_update_post(scene, depsgraph)` | Fires on every graph flush — hash guard essential |
| `save_post(filepath, **kw)` | 5.1 signature; earlier builds had `(scene,)` |
| `load_post(*_)` | Bootstrap hook — re-registers the full suite |
| `evaluated_get(dg).to_mesh()` | Post-modifier geometry; must call `to_mesh_clear()` |

## Studio Route

`/tutorials/blender-tutorial-python-bpy-app-handlers-persistent-event-hooks-webxr`
