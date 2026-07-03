# Python Custom Pie Menu — Holoflow Rigging & Export Toolkit
## Blender 5.1

An 8-slot radial context menu bound to **Shift+Space** in the 3D View.
Surfaces the eight most-used Holoflow studio operations without leaving
the viewport — no sidebar trip, no menu nesting.

## Slot map

| Direction | Label | Operator / Action |
|-----------|-------|-------------------|
| W | Mark Seams | `holoflow.pie_mark_seams_sharp` |
| E | Quick GLB | `holoflow.pie_quick_glb_export` |
| S | Apply Modifiers | `holoflow.pie_apply_all_modifiers` |
| N | Tag Facet | `holoflow.pie_tag_facet` |
| NW | Sidebar | `wm.context_toggle` (show_region_ui) |
| NE | Reset Xform | `object.transforms_to_deltas` (ALL) |
| SW | Freeze Pose | `object.visual_transform_apply` |
| SE | Split UV | `screen.area_split` (VERTICAL) |

**Hotkey:** Shift+Space — scoped to VIEW_3D / WINDOW region only.
Blender's default Space (Play) is in Timeline/Dopesheet space; no collision.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Scripting workspace → Run Script → registers pie + demo scene |
| `record.py` | Headless viewport render → PNG frames → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar screen capture instructions |
| `.expected-artefacts.json` | CI artefact checklist |

## Requirements

- Blender 5.1 (GLTF exporter kwargs may differ on older versions)
- No external extensions required — all standard `bpy` APIs

## Reuse

Import the macro at `tools/blender-addon/holoflow_macros/pie_menu_toolkit.py`
into your add-on and call its `register()` / `unregister()` from your own
add-on register functions.

## Production pipeline

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → Run Script (Alt+P)
3. Switch to Layout workspace → Shift+Space → work with the pie
4. Run `record.py` headless to generate `viewport.mp4`
5. Follow `SCREEN-RECORDING-NOTES.md` for `screen.mp4`

## Outside sources

- Blender Foundation — `scripts/templates_py/ui_pie_menu.py` — **Apache-2.0**
  <https://projects.blender.org/blender/blender/src/branch/main/scripts/templates_py/ui_pie_menu.py>
  Upstream org: blender/blender · Siblings: blender/blender-addons, blender/blender-extensions
- Blender Python API Reference — `bpy.types.Menu`
  <https://docs.blender.org/api/current/bpy.types.Menu.html>
  Blender Foundation, CC-BY-SA-4.0
