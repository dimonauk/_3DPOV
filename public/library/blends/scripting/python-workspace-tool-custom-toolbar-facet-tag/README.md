# Python WorkSpaceTool — holoflow:facet Click-Tagger

**Blender 5.1 · Scripting · CC0**

A custom toolbar tool that integrates into Blender's built-in T-panel in
Edit-Mesh mode, allowing you to click-assign the `holoflow:facet` INT
attribute to individual faces.  The tool registers via
`bpy.utils.register_tool()` — a separate code path from the N-panel
`bpy.utils.register_class()` route — and demonstrates the three
class-attribute patterns that WorkSpaceTools rely on: `bl_keymap`,
`draw_settings`, and `bl_cursor`.

## What this tutorial builds

- A **WorkSpaceTool** that appears in the Toolbar (T) under Edit-Mesh mode,
  after the built-in Select tool, separated by a thin divider line.
- A **Modal Operator** (`mesh.holoflow_facet_tag_click`) fired on
  LEFTMOUSE PRESS, which click-selects the face under the cursor then
  writes `holoflow:facet` via bmesh.
- A **header-bar toggle** (`draw_settings` static method) showing an
  Enable/Disable button that controls whether clicks write 1 or 0.
- A **demo scene**: 10×10 mesh grid, checkerboard pre-tagged attribute,
  orange/grey preview material reading the attribute via ShaderNodeAttribute.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Registers tool + creates demo scene; run in Scripting workspace |
| `record.py` | Renders 180 frames for the viewport.mp4 animation |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Quick start

1. Blender 5.1 → Scripting workspace → open `blueprint.py` → Run Script.
2. Switch to Layout workspace → select `facet_demo_grid` → Tab into Edit Mode.
3. Press T to open the Toolbar.  Scroll to find **HF Facet Tag** after the separator.
4. Activate the tool.  Header bar shows "Enable" toggle.
5. Click faces — orange faces are tagged (1), grey are cleared (0).
6. Open the Spreadsheet editor, set Domain = Face, column `holoflow:facet`.

## Holoflow pipeline connection

The `holoflow:facet` attribute is read by the `holoflow_webxr_exporter` add-on
at `tools/blender-addon/` when `export_extras=True` — it embeds the per-face
value into the glTF `extras` object, accessible in Three.js at
`mesh.userData["holoflow:facet"]`.

## Outside sources

- Blender Foundation — `bpy.types.WorkSpaceTool` API Reference —
  CC-BY-SA-4.0 — <https://docs.blender.org/api/5.1/bpy.types.WorkSpaceTool.html>
- Robert Guetzkow — blender-python-examples — MIT —
  <https://github.com/robertguetzkow/blender-python-examples>
