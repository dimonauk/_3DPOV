# Python — bpy.data.libraries.load: Linking & Appending Datablocks

**Blender 5.1 | Category: Scripting | Licence: CC0**

Programmatically link or append collections, objects, materials, and node groups
from an external `.blend` file — the foundation of any multi-file studio pipeline.

## What this builds

- `~/holoflow_assets.blend` — source asset file: `HF_PropKit` collection (three
  crystal props) + `HF_Faceted_Flat` material, both marked as assets.
- `~/holoflow_assembly.blend` — assembly scene that **links** the prop collection
  and **appends** a local copy of the material, then saves.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full runnable script — steps 0–6: build, link, append, override, inspect, relocate |
| `record.py` | Off-screen bpy render — three crystals pop in sequentially, outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

```bash
blender --background --python blueprint.py
```

Or open Blender → Scripting workspace → New → paste → Alt+P.

## Key concepts

| Concept | API |
|---------|-----|
| Open external .blend | `bpy.data.libraries.load(path, link=True/False)` |
| Link (external ref) | `link=True` — `ob.library is not None` |
| Append (local copy) | `link=False` — `ob.library is None` |
| Catalogue datablocks | Open with `link=False`, read `src.collections` etc., assign nothing |
| Make override | `bpy.ops.object.make_override_library()` |
| Relocate library | `lib.filepath = new_path` then `bpy.ops.wm.lib_relocate()` |

## Troubleshooting

**"Collection not in source file"** — check COLLECTION_NAME spelling and run
`list_datablocks()` to print all available names before linking.

**Orange outline but can't edit** — correct, that is a linked object. Run
`make_collection_override()` first to create a locally-editable override.

**`make_override_library()` raises RuntimeError** — ensure the linked
collection is linked to the active view layer (not just in bpy.data.collections).
Add it via `bpy.context.scene.collection.children.link(linked_coll)` first.

**Library shows as missing after moving files** — call `relocate_library()` with
the new path, or use File → External Data → Find Missing Files.

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-python-library-link-append-blend-files`
- Related: Python Asset Library Mark Catalogue tutorial
- Related: Python Batch GLB Exporter tutorial
- Related: Python Context Temp Override Mesh Repair tutorial
