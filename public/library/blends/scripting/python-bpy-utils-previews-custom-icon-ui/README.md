# bpy.utils.previews — Custom Icon Thumbnails & Render Previews
**Blender 5.1 | Python Extension | CC0**

`bpy.utils.previews` is the only official mechanism for injecting custom
PNG images into Blender's UI layer as icon integers.  This blueprint
demonstrates the complete pipeline: generating icon PNGs, loading them
into a module-level `PreviewCollection`, using `icon_value=` in panel
props and operators, and capturing a live render thumbnail on demand.

## Key concepts demonstrated

| Concept | Where |
|---------|-------|
| Module-level `PreviewCollection` singleton | `_pcoll` global |
| `bpy.utils.previews.new()` + `load()` | `register_previews()` |
| Double-registration guard | `if _pcoll is not None: remove()` |
| `icon_value=` in `layout.prop()` | `HLF_PT_IconDemo.draw()` |
| Dynamic `EnumProperty` items with `icon_value=` | `_format_items()` callback |
| `layout.template_icon(icon_value=…, scale=…)` | Render thumbnail display |
| Workbench render → PNG save → `slot.reload()` | `HLF_OT_CaptureRenderThumb` |
| `sub.alert = True` — row tint on empty slot | `HLF_PT_IconDemo.draw()` |
| `bpy.utils.previews.remove()` GPU cleanup | `unregister_previews()` |

## File layout

```
icons/
├── GLB.png            32×32 RGBA — teal-green format icon (auto-generated)
├── GLTF_SEPARATE.png  32×32 RGBA — amber format icon (auto-generated)
└── render_thumb.png   128×128 RGBA — live render thumbnail (captured on demand)
blueprint.py           Full add-on — paste into Text Editor, Alt+P
record.py              Viewport animation recorder (72-frame orbit)
SCREEN-RECORDING-NOTES.md  OBS shot list for screen.mp4
```

## Quick start

```python
# 1. Open blueprint.py in Blender's Text Editor (Scripting workspace).
# 2. Press Alt+P — the add-on registers and seeds the queue with the first
#    two objects in the current scene.
# 3. Switch to 3D Viewport → N (sidebar) → Holoflow → Icon Demo.
# 4. Click 'Capture Render Thumbnail' to fill the top preview slot.
```

## Important gotchas

- **PNG must be RGBA** (alpha channel present).  RGB-only PNGs render as black
  in Blender's icon cache.
- **Icon_value ≠ icon string**.  `icon="EXPORT"` uses a built-in string enum.
  `icon_value=42` uses an integer handle.  You cannot mix them in one call.
- **Module-level singleton only**.  Calling `bpy.utils.previews.new()` inside
  `register()` leaks GPU handles on every Alt+P reload.
- **Dynamic EnumProperty at import time is too early**.  Icon IDs are not valid
  until after `register_previews()`.  Always use a callback function, not a
  static list, when using `icon_value=` in an EnumProperty.

## Output files

| File | Description |
|------|-------------|
| `blueprint.py` | Add-on source |
| `record.py` | Viewport recorder |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions |
| `icons/` | Auto-generated placeholder PNGs |
| `viewport.mp4` | Composited viewport recording |
| `screen.mp4` | OBS screen capture |

## Tutorial

`/tutorials/blender-tutorial-python-bpy-utils-previews-custom-icon-ui`

## Outside references

1. **Blender Python API — bpy.utils.previews**
   https://docs.blender.org/api/current/bpy.utils.previews.html
   © Blender Foundation — CC-BY-SA 4.0 (API reference, no content reproduced)

2. **nutti/fake-bpy-module** — MIT licence
   https://github.com/nutti/fake-bpy-module
   Type stubs for the full `bpy` surface including `ImagePreviewCollection`
   — useful for IDE autocompletion while authoring add-ons.

3. **robertguetzkow/blender-python-examples** — MIT licence
   https://github.com/robertguetzkow/blender-python-examples
   Comprehensive collection of add-on patterns including icon loading examples.
