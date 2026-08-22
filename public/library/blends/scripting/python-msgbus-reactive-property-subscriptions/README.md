# Python: bpy.msgbus — Reactive Property Subscriptions & Dirty-Export Pipeline

**Blender 5.1 · Holoflow Studio · CC0**

## What this teaches

`bpy.msgbus` is Blender's publish-subscribe system for RNA property changes.
Subscribe to a property once; your callback fires synchronously whenever that
property mutates — no polling, no per-frame overhead.  This tutorial builds a
complete dirty-export pipeline: objects are flagged for re-export exactly when
their `holoflow.facet` property changes, not on every frame tick.

## Key concepts

| Concept | Detail |
|---|---|
| `bpy.msgbus.subscribe_rna()` | Attach a callback to an RNA property change |
| Class-level key `(Type, "prop")` | Fires for ANY instance of that type |
| Per-object key `obj.prop.path_resolve("field", False)` | Fires for ONE specific object |
| `options={"PERSISTENT"}` | Subscription survives `bpy.ops.wm.open_mainfile()` |
| `bpy.msgbus.clear_by_owner(token)` | Remove all subscriptions by owner group |
| `bpy.msgbus.publish_rna(key=...)` | Manually fire callbacks without mutating |
| `@bpy.app.handlers.persistent` on `load_post` | Re-register per-object subscriptions after file load |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full pipeline: PropertyGroup, two subscription strategies, dirty-export |
| `record.py` | Viewport animation: colour state transitions over 90 frames |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture instructions |
| `.expected-artefacts.json` | CI-checkable artefact list |

## Running

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → Run Script
3. Open Blender's System Console (Window > Toggle System Console) to watch callbacks
4. Toggle `hs_sphere.holoflow.facet` in the N-panel → observe console output
5. Call `export_dirty_objects()` in the Python Console to flush the queue

## Outside sources

- [bpy.msgbus API — Blender Foundation](https://docs.blender.org/api/current/bpy.msgbus.html)
  (CC-BY-SA 4.0, Blender Foundation)
- [Blender Message Bus developer notes](https://developer.blender.org/docs/features/message_bus/)
  (CC-BY-SA 4.0, Blender Foundation)
- [njanakiev/blender-scripting](https://github.com/njanakiev/blender-scripting)
  (MIT, Nicolas Janakiev) — general bpy scripting patterns reference

## Studio cross-references

- Tutorial: [Python App Handler + Depsgraph](/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph)
- Tutorial: [Python Addon Custom Panel + PropertyGroup](/tutorials/blender-tutorial-python-addon-custom-panel-property-group)
- Tutorial: [Python Batch GLB Exporter](/tutorials/blender-tutorial-python-batch-glb-exporter)
- Tutorial: [Python Shape Key Driver Rig for VRM](/tutorials/blender-tutorial-python-shape-key-driver-rig-vrm-facial)
