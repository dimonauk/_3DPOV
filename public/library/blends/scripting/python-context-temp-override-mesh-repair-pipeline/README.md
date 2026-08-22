# Python bpy.context.temp_override() — Headless Mesh Repair Pipeline

**Blender 5.1 · Python scripting · CC0 1.0 Universal**

## What This Is

`blueprint.py` demonstrates `bpy.context.temp_override()` — the Blender 4.0+
context-patching API that replaces the deprecated `bpy.context.copy()` dict
approach — to safely execute edit-mode mesh operators from any script context.

The practical payload is a three-pass mesh repair pipeline used in the
Holoflow Studio asset export workflow:

| Pass | Operator | What it fixes |
|------|----------|---------------|
| 1 | `mesh.remove_doubles` | Duplicate vertices at UV-seam splits |
| 2 | `mesh.normals_make_consistent` | Flipped / inconsistent face normals |
| 3 | `mesh.tris_convert_to_quads` | Triangulated OBJ/STL import geometry |

## Quick Start

1. Open Blender 5.1 with a **3D Viewport** visible.
2. Open `blueprint.py` in the Text Editor.
3. Set `COLLECTION_NAME` to the collection holding your props, or leave the
   default (`holoflow_props`) to use the built-in demo scene.
4. Press **Run Script** (Alt+P).

## Why `temp_override` and Not the Dict Pattern?

The old dict pattern (`ctx = bpy.context.copy(); ctx["area"] = ...;
bpy.ops.foo(ctx, ...)`) was removed in Blender 4.0. Scripts using it raise
`TypeError: bpy.ops.* no longer accepts a context argument`.
`temp_override()` is the official replacement — a Python context manager
that temporarily patches the global `bpy.context` for the duration of the
`with` block.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Expert annotated pipeline script |
| `record.py` | Automated viewport render (10 s, 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Outside Sources

- Blender Manual — Context Overrides (CC-BY-SA 4.0, Blender Documentation Team)
  https://docs.blender.org/manual/en/latest/advanced/scripting/context_override.html
- Blender Python API — `bpy.types.Context.temp_override` (CC-BY-SA 4.0)
  https://docs.blender.org/api/current/bpy.types.Context.html#bpy.types.Context.temp_override
