# Python — Asset Library API: Batch-Mark Materials & Node Groups as Catalogue Assets
**Blender 5.1 | CC0 | Holoflow Studio**

## What this entry covers

The Blender Asset Library system (introduced in 3.0, API stable from 4.0) turns
ordinary datablocks — materials, objects, node groups, worlds — into reusable studio
assets addressable from any `.blend` via the Asset Browser.  This entry shows the full
Python path: create procedural materials, mark them with `asset_mark()`, write catalogue
entries to `.cats.txt`, and save to an external library `.blend`.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Python script — 4 materials created, marked, catalogued, saved |
| `record.py` | Viewport orbit render of the 4 preview spheres → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the screen recording |
| `.expected-artefacts.json` | CI artefact manifest |

## Key API surface

```python
mat.asset_mark()                          # writes AssetMetaData onto the datablock
mat.asset_data.description = "..."        # freeform description (shown in Asset Browser)
mat.asset_data.catalog_id  = UUID_STR     # must match a UUID in .cats.txt
mat.asset_data.tags.new("tag", skip_if_exists=True)
bpy.ops.ed.lib_id_generate_preview()      # trigger thumbnail render (interactive only)
bpy.ops.wm.save_as_mainfile(filepath=..., copy=True)  # save to library without changing active file
```

## .cats.txt format

```
VERSION 1
UUID:category/path:Display Name
```

UUIDs are fixed per category. Commit them to VCS. Never change them — Blender links
materials to catalogue entries by UUID, not by path string.

## Running

```bash
blender --background --python blueprint.py
```

The external library `.blend` lands at `~/holoflow_asset_lib.blend`.
Register it in **Edit → Preferences → File Paths → Asset Libraries** to use it across projects.

## Outside sources

- **Blender Manual — Asset Libraries** (CC-BY 4.0)  
  https://docs.blender.org/manual/en/latest/files/asset_libraries/introduction.html
- **Blender Developer Docs — AssetMetaData** (CC-BY 4.0)  
  https://docs.blender.org/api/current/bpy.types.AssetMetaData.html

## Catalogue UUIDs used

These are Holoflow-specific and stable across all studio sessions:

| UUID | Category |
|------|---------|
| `ho10f1ow-0001-0001-0000-000000000001` | Holoflow/Materials/PBR |
| `ho10f1ow-0001-0002-0000-000000000001` | Holoflow/Materials/NPR |
| `ho10f1ow-0002-0000-0000-000000000002` | Holoflow/NodeGroups |
