# bpy.context.temp_override() — Headless Operator Context Injection

**Blender**: 5.1 | **Licence**: CC0 | **Topic**: scripting

## What this teaches

`bpy.ops` operators poll a context dictionary before executing. In a headless
Blender session — or when the Script Editor does not have a 3-D View in focus —
required fields such as `active_object` or `selected_objects` may be `None`,
producing `RuntimeError: Operator bpy.ops.X.y poll failed`.

The old workaround of passing a dict as the first positional argument to
`bpy.ops.*(...)` was deprecated in Blender 3.2 and removed in 5.1. The
correct pattern is the `bpy.context.temp_override()` context manager, which
temporarily patches named attributes on `bpy.context` for the duration of a
`with`-block, then restores originals atomically.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Complete annotated script: data-API creation, apply-modifier, shade-smooth, rigidbody.object_add, GLB export — all with correct 5.1 context patterns |
| `record.py` | Viewport animation render (spin-in cube) → `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS walkthrough for `screen.mp4` |

## Usage

Open `blueprint.py` in Blender 5.1 Script Editor and press **Run Script**.
No external add-ons required.

## Key pitfalls

- `active_object` alone is not always enough — many ops also poll `selected_objects`.
- Operators that require an `area` (e.g. `bpy.ops.node.select_all` in the
  Node Editor) cannot be driven headlessly without building a fake area from
  `bpy.context.window.screen.areas`.
- Always prefer the direct data API over `bpy.ops` where a data path exists.

## Outside sources

- Blender Foundation · bpy.context API · CC-BY-SA 4.0
  https://docs.blender.org/api/5.1/bpy.context.html
- Blender Foundation · 3.2 Python API Release Notes · CC-BY-SA 4.0
  https://wiki.blender.org/wiki/Reference/Release_Notes/3.2/Python_API
