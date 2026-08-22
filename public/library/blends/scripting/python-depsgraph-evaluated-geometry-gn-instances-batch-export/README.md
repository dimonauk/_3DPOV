# Python bpy.types.Depsgraph — Evaluated Geometry, GN Instances & Batch GLB Export

**Blender 5.1 | CC0 | Holoflow Studio**

The dependency graph (depsgraph) is the layer between authoring data and
runtime data.  Every modifier, Geometry Nodes tree, constraint, driver,
and shape key runs inside the depsgraph.  Scripts that read
`bpy.data.objects["X"].data` see the *original* mesh — before any of that
evaluation.  This tutorial teaches the four production patterns for
reaching the evaluated result.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main tutorial script — all four depsgraph patterns |
| `record.py` | Automated viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick Start

1. Open Blender 5.1.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor.
4. Press **Run Script** (Alt+P or the ▶ button).
5. Check the System Console for printed vertex counts and instance lists.
6. Set `OUTPUT_DIR` to an absolute path, then call
   `batch_export_instances("CrystalScatter")` to write GLB files.

## Key Concepts

- `context.evaluated_depsgraph_get()` — get the current evaluated depsgraph
- `obj.evaluated_get(dg)` — shadow-object with modifier stack applied
- `obj.to_mesh(depsgraph=dg)` + `obj.to_mesh_clear()` — snapshot & free
- `bpy.data.meshes.new_from_object(obj, depsgraph=dg)` — persistent bake
- `dg.object_instances` — iterate every instance including GN scatter
- `view_layer.update()` — force evaluation before reading

## Outside Sources

- Blender Foundation — *bpy.types.Depsgraph API*
  https://docs.blender.org/api/5.1/bpy.types.Depsgraph.html
  CC-BY-SA 4.0

- Blender Foundation — *object_instances iteration example*
  https://docs.blender.org/api/5.1/bpy.types.DepsgraphObjectInstance.html
  CC-BY-SA 4.0
