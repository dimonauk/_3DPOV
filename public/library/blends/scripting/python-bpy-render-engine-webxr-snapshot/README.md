# Python: bpy.types.RenderEngine — Custom Snapshot Engine for WebXR GLB Export

**Blender 5.1 · Holoflow Studio · CC0**

## What this teaches

`bpy.types.RenderEngine` is Blender's registration hook for full custom
renderers.  Subclassing it lets you intercept the standard render pipeline —
F12, Render > Image, `bpy.ops.render.render()`, and the command-line `-f` flag
— and replace pixel rasterisation with any Python action: here, a complete
Holoflow GLB export triggered by a single keypress.

The engine appears in Scene > Render Engine alongside Cycles and EEVEE.
Studio automation scripts using `blender --background scene.blend -f 1`
pick it up without extra flags.

## Key concepts

| Concept | Detail |
|---|---|
| `bpy.types.RenderEngine` subclass | Base class for all Blender render engines |
| `bl_use_preview = False` | Skip material-preview sphere renders (fires hundreds of times per session) |
| `bl_use_postprocess = False` | Skip compositor / colour-management pass |
| `begin_result(x, y, w, h)` | Allocate a render result tile — MANDATORY |
| `result.layers[0].passes["Combined"].rect` | Flat RGBA list, length = w × h × 4 |
| `end_result(result)` | Finalise result — MANDATORY; skipping freezes the render pipeline |
| `update(self, data, depsgraph)` | Pre-render hook; cache paths here — `bpy.context` safe |
| `render(self, depsgraph)` | Main body; `bpy.context` may be limited in `--background` mode |
| `test_break()` | Returns `True` if user pressed Escape — abort cleanly |
| `update_progress(t)` | Show 0–1 progress in the header bar |
| `update_stats(info, mem)` | Override the render stats overlay |
| `view_update / view_draw` | Viewport material-preview hooks; return immediately if unused |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full engine + settings panel + demo scene |
| `record.py` | Viewport animation: idle → active → done colour states over 90 frames |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for screen.mp4 |
| `.expected-artefacts.json` | CI-checkable artefact list |

## Running

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → Run Script
3. Switch to Properties → Render tab → confirm engine = **Holoflow WebXR Snapshot**
4. Select the objects you want to export
5. Press **F12** — a white 1×1 render appears briefly, then the GLB lands in
   `//output/webxr_export/Scene_snapshot.glb`
6. Watch the System Console (Window > Toggle System Console) for the export path

## Running headless

```bash
blender --background my_scene.blend \
        --python blueprint.py \
        --render-frame 1
```

The `--python` flag registers the engine before `--render-frame` triggers it,
so the export runs without any GUI.

## Outside sources

- [bpy.types.RenderEngine API — Blender Python Reference](https://docs.blender.org/api/current/bpy.types.RenderEngine.html)
  (CC-BY-SA 4.0, Blender Foundation)
- [Custom Render Engine template — Blender source templates](https://github.com/blender/blender/blob/main/scripts/templates_py/custom_nodes.py)
  (GPL-2.0+, Blender Foundation — used as conceptual reference only; this implementation is an independent CC0 rewrite)
- [robertguetzkow/blender-python-examples](https://github.com/robertguetzkow/blender-python-examples)
  (MIT, Robert Guetzkow) — general bpy API patterns reference

## Studio cross-references

- Tutorial: [Python Batch GLB Exporter](/tutorials/blender-tutorial-python-batch-glb-exporter)
- Tutorial: [Python App Handler + Depsgraph](/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph)
- Tutorial: [Python Addon Preferences + Keymap](/tutorials/blender-tutorial-python-addon-preferences-keymap-hotkey-exporter)
- Tutorial: [Python glTF User Extension Export Hook](/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook)
