# Python bpy.types.GizmoGroup
## Holoflow Facet Tag Visualiser — Persistent Viewport Gizmo Overlay
### Blender 5.1 | CC0

---

## What this is

A self-contained Blender add-on module that registers a persistent 3D viewport
overlay using `bpy.types.GizmoGroup`. The overlay draws a green circle above
every mesh object tagged with `holoflow:facet = 1` and an arrow aligned to its
local +Y axis (the WebXR export up-direction). Clicking a circle fires the
`HOLOFLOW_OT_toggle_facet_tag` operator which flips the tag on/off with full
undo-stack support.

---

## When to use GizmoGroup vs alternatives

| Approach | Registered via | Hover / select | Undo | Tool dependency |
|---|---|---|---|---|
| `draw_handler_add` | `SpaceView3D.draw_handler_add` | ✗ | ✗ | None |
| `bpy.types.GizmoGroup` | `bpy.utils.register_class` | ✓ | ✓ | None (with PERSISTENT) |
| GN Gizmo nodes | Geometry Nodes socket | ✓ | ✓ | Requires active Node Tool |
| `bpy.types.WorkSpaceTool` | `bpy.utils.register_tool` | ✓ | ✓ | User must select tool |

`GizmoGroup` is the right choice when you need interactive 3D handles that are
always visible, do not require the user to switch tools, and must participate in
the undo stack.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full add-on: GizmoGroup, toggle operator, N-panel toggle button |
| `record.py` | Viewport animation render (Workbench, 120 frames → viewport.mp4) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

---

## Key API surface (Blender 5.1)

```python
# Registration
bpy.utils.register_class(MyGizmoGroup)   # same call as any other type

# Gizmo allocation (inside setup())
gz = self.gizmos.new("GIZMO_GT_primitive_3d")
gz.draw_style = 'CIRCLE'

# Positioning (inside refresh())
gz.matrix_basis = mathutils.Matrix.Translation(world_pos)

# Binding to an operator (called on click)
op = gz.target_set_operator("my.operator")
op.some_prop = "value"   # operator properties set here

# Binding to a property (used for drag-interactive gizmos)
gz.target_set_prop("offset", obj, '["my_custom_prop"]')
```

---

## Outside sources

- Blender API docs — `bpy.types.GizmoGroup` — CC-BY Blender Foundation
  https://docs.blender.org/api/current/bpy.types.GizmoGroup.html
- Blender source — `scripts/templates_py/gizmo_custom_geometry.py` — MIT / CC0
  https://projects.blender.org/blender/blender/src/branch/main/scripts/templates_py/gizmo_custom_geometry.py
  Sibling repos: `blender/blender-addons`, `blender/blender-extensions`

---

## Tutorial

`/tutorials/blender-tutorial-python-gizmo-group-custom-viewport-handle`
