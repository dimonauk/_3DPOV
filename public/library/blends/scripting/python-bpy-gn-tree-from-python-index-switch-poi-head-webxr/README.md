# Python bpy — GN Tree from Python: Index Switch, Multi-Variant Poi Head (Blender 5.1)

Build an entire Geometry Nodes modifier tree programmatically using
`bpy.data.node_groups`, the Blender 4.0+ `ng.interface` API, and the
Blender 4.1+ `GeometryNodeIndexSwitch` node. A single integer input
(`Variant`) selects among three poi-head shapes — UV sphere, drum
cylinder, spike cone — at modifier evaluation time, with no separate
objects or shape keys.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full working script — run in Scripting workspace |
| `record.py` | Viewport animation setup for variant-switching demo |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Outputs

| File | Where |
|---|---|
| `hf_poi_head.blend` | Saved alongside blueprint.py |
| `hf_poi_head.glb` | Same directory (Variant 0 = sphere baked) |
| `videos/…/viewport.mp4` | Render from record.py (Ctrl+F12) |
| `videos/…/screen.mp4` | OBS screen recording |

## Key techniques

- **`ng.interface.new_socket()`** — Blender 4.0+ socket interface API (replaces removed `ng.inputs.new()`)
- **`sw.data_type = 'GEOMETRY'`** — must set before adding Index Switch items
- **`sw.index_switch_items.new()`** — extend the switch beyond the default 2 items
- **Socket identifier lookup** — `ng.interface.items_tree` for stable `mod[id]` access
- **CONSTANT interpolation** — correct keyframe type for integer variant animation

## Blender version

5.1 — requires 4.1+ for `GeometryNodeIndexSwitch`, 4.0+ for `ng.interface`

## Tutorial

[/tutorials/blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr](https://holoflow.co.uk/tutorials/blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr)

## Licence

CC0 — Holoflow Studio
