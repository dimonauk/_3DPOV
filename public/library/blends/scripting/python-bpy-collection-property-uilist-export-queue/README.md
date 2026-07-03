# CollectionProperty + UIList — Holoflow Export Queue Panel
**Blender 5.1 | Python Extension | CC0**

A complete Blender 5.1 extension that adds a reorderable batch-export
queue to the Holoflow N-panel. Each queue slot holds a PointerProperty
reference to a scene object plus per-item overrides (Draco level, format,
include toggle). Three operators — Add, Remove, Move — handle all list
mutations; the UIList widget draws each row via `draw_item()`.

## Key concepts demonstrated

| Concept | Where |
|---------|-------|
| `CollectionProperty` on `Scene` | `register()` — attached after item class |
| `UIList.draw_item()` | `HLF_UL_ExportQueue` |
| `template_list()` with active index | `HLF_PT_ExportQueue.draw()` |
| Add / Remove / Move operator pattern | `HLF_OT_Queue*` classes |
| `PointerProperty(type=Object)` robustness | `HLF_ExportQueueItem.obj` |
| Non-destructive include toggle | `HLF_ExportQueueItem.include` |
| Batch GLB export with `use_selection` | `HLF_OT_BatchExport.execute()` |

## Usage

```
# In Blender's Scripting workspace:
#   1. Open blueprint.py in the Text Editor.
#   2. Press Alt+P to register and seed the demo queue.
#   3. Switch to 3D Viewport → N-panel → Holoflow → Export Queue.
```

## Output files

| File | Description |
|------|-------------|
| `blueprint.py` | Full add-on — paste + Alt+P to run |
| `record.py` | Viewport animation recorder (72-frame orbit) |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |
| `viewport_####.png` | Rendered frames (after running record.py) |
| `viewport.mp4` | Composited recording (FFmpeg stitch manually) |
| `screen.mp4` | OBS screen capture of the add-on panel in use |

## Tutorial

`/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue`

## Outside references

1. **Blender Python API — bpy.types.UIList**
   https://docs.blender.org/api/current/bpy.types.UIList.html
   © Blender Foundation — CC-BY-SA 4.0 (linked for API reference; no content reproduced)

2. **Blender Python API — bpy.props.CollectionProperty**
   https://docs.blender.org/api/current/bpy.props.html#bpy.props.CollectionProperty
   © Blender Foundation — CC-BY-SA 4.0 (linked for API reference; no content reproduced)
