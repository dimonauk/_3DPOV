# Python bpy.types.Panel + Operator — N-Panel Sidebar Add-on (Blender 5.1)

**Topic**: Add-on authoring — PropertyGroup, Panel, Operator, register/unregister  
**Blender version**: 5.1  
**Licence**: CC0  
**Studio interest**: WebXR export prep, custom tooling, holoflow_webxr_exporter

---

## What this does

`blueprint.py` is a complete, production-quality Blender 5.1 add-on that adds a **"HoloFlow" tab** to the 3D Viewport N-Panel sidebar. It demonstrates:

- `PropertyGroup` subclasses attached to `bpy.types.Scene` and `bpy.types.Object` via `PointerProperty`
- `bpy.types.Panel` with `bl_category`, `bl_parent_id` sub-panels, `layout.use_property_split`, and operator buttons
- `bpy.types.Operator` with `poll()`, `execute()`, operator properties set from the UI, and `context.temp_override()`
- `register()` / `unregister()` class lists, PointerProperty cleanup order
- Custom properties with colons (`holoflow:facet`) that can't be set via attribute access

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | The add-on — run from Scripting workspace or install via Preferences |
| `record.py` | Renders a 90-frame viewport animation of the three prop meshes |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list and settings for the screen.mp4 capture |
| `.expected-artefacts.json` | Declares expected output files for the library validator |

## Running blueprint.py

### From the Scripting workspace (quickest)
1. Open `blueprint.py` in Blender's Text Editor.
2. Press **Run Script** (▶ or Alt+P).
3. Press **N** in the 3D Viewport to open the sidebar — a **HoloFlow** tab appears.

### As an installed add-on
1. In Blender: **Edit → Preferences → Add-ons → Install…**
2. Select `blueprint.py`.
3. Enable **HoloFlow Export Prep** in the list.

## Running record.py

Open `record.py` in the Scripting workspace and run it. The output renders to:

```
public/library/videos/scripting/python-custom-panel-operator-n-panel-sidebar/viewport.mp4
```

## Outside sources

- **Robert Guetzkow** — *blender-python-examples* (MIT)  
  <https://github.com/robertguetzkow/blender-python-examples>  
  Operator, panel, and PropertyGroup reference implementations. The `custom_operator/` and `property_group/` sub-folders map directly to this tutorial.

- **Blender Foundation** — *bpy.types.Panel / bpy.types.Operator API Reference* (CC-BY-SA 4.0)  
  <https://docs.blender.org/api/current/bpy.types.Panel.html>  
  <https://docs.blender.org/api/current/bpy.types.Operator.html>
