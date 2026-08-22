# Python — bpy.app.handlers Frame-Change Hook + Evaluated Depsgraph

**Blender 5.1 · Scripting · CC0**  
Slug: `python-app-handler-frame-change-depsgraph`

Registers a `@persistent` `frame_change_post` handler that displaces every
vertex of a subdivided grid with a radial sine-wave ripple. The displacement
formula reads `scene.frame_current` so the animation is framerate-independent
and does not require keyframes.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene setup + handler registration + GLB snapshot |
| `record.py` | EEVEE animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS screen-capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick Start

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Open `blueprint.py` and press **Run Script** (▷).
3. Switch to the **3D Viewport** and press **Space** to play. The grid ripples.
4. To stop the handler: in the Scripting workspace, run `_unregister_handler()`.

## Key Concepts

### `@bpy.app.handlers.persistent`

Without this decorator, Blender silently removes all handlers when a `.blend`
file is loaded or reloaded. The `@persistent` marker stores the function in a
special registry that survives file operations. It is defined in
`bpy.app.handlers` and requires no extra import.

### `evaluated_depsgraph_get()` vs `obj.evaluated_get(dg)`

`bpy.context.evaluated_depsgraph_get()` returns a `DepsgraphEval` — the object
that reflects all current dependency relationships and modifier outputs.
`obj.evaluated_get(dg)` gives you the *evaluated copy* of a specific object:
an ephemeral datablock with modifier-applied vertex positions. You can read
from the evaluated copy, but you must write back to `obj.data` (the base mesh)
because the evaluated copy is discarded after each depsgraph tick.

### Base-Mesh Write-Back

After `obj.data.vertices.foreach_set("co", flat_list)`, call `obj.data.update()`
to mark the mesh dirty. The depsgraph will then re-evaluate all modifiers
(Subdivision Surface, Displace, etc.) on top of the new base positions. This
means time-based formulas that derive Z purely from frame are safe; formulas
that read back from the evaluated mesh risk a one-frame lag.

### GLB Export Caveat

`frame_change_post` does not fire during background renders (`blender -b`).
For CLI-batch exports, either:
- Use `bpy.ops.render.render(animation=True)` from within a running Blender
  session (the handler fires per `scene.frame_set()` internally), or
- Replace the handler with a Geometry Nodes tree whose inputs map to
  `Scene Time → Frame` socket — GN evaluates correctly in all contexts.

## Tutorial

`/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph`

## Outside Sources

- **Blender Python API — bpy.app.handlers**  
  <https://docs.blender.org/api/current/bpy.app.handlers.html>  
  Licence: CC BY, © Blender Foundation

- **Blender Developer Docs — Dependency Graph**  
  <https://wiki.blender.org/wiki/Source/Depsgraph>  
  Licence: CC BY-SA, © Blender Foundation

## Licence

CC0 — No rights reserved. Attribution appreciated but not required.
