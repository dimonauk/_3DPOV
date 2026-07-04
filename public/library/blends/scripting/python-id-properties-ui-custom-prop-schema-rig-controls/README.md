# Python IDPropertyUIManager — Custom Property Schema for Rig Controls
**Blender 5.1 · CC0 · Holoflow Studio**

## What this is

`blueprint.py` adds five float sliders, two integer selectors, and two boolean
toggles to an armature object, then attaches a full `IDPropertyUIManager` schema
to each — min, max, description, subtype, step, precision, and
`is_overridable_library` — without a registered add-on.  It also demonstrates
`id_properties_ensure()` for a nested metadata group on the mesh that the
Holoflow GLB exporter reads at export time.

## Custom ID props vs PropertyGroup

| Aspect | Custom ID props `obj["key"]` | `bpy.props` PropertyGroup |
|--------|------------------------------|---------------------------|
| Add-on required to deserialise | **No** | Yes (add-on must be installed) |
| Survives library link | **Yes** | No (class not in linked file) |
| `is_overridable_library` flag | **Yes** | No (per-property) |
| `update` callbacks | No | Yes |
| Animatable via fcurve | **Yes** | Yes |
| UI hints (min/max/description) | Via `id_properties_ui()` | Via `bpy.props.*` kwargs |

The critical difference for the Holoflow pipeline: when a character rig is
**linked** from an asset library, the mesh and armature data-blocks arrive with
their ID props intact.  Without an add-on, the artist can still see sliders with
correct min/max/descriptions and key them to drive shape keys.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full property setup — run in Blender Text Editor |
| `record.py` | Keyframes `wing_spread` 0 → 1 → 0, renders `viewport.mp4` via Workbench |
| `SCREEN-RECORDING-NOTES.md` | OBS recording guide for `screen.mp4` |

## Blender version

Tested on **Blender 5.1**.  The `IDPropertyUIManager` API is stable since 3.3;
`is_overridable_library` kwarg added in 3.6.

## Licence

All code in this directory: **CC0 1.0 Universal** (public domain).
