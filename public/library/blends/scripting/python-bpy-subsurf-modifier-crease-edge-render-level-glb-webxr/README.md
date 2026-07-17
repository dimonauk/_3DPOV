# Python bpy.types.SubsurfModifier — Crease-Controlled Subdivision & GLB Export

**Blender 5.1 · Scripting · CC0**

Catmull-Clark subdivision rounds every edge by default. The art of
hard-surface SubD is choosing which edges resist that rounding — and by how
much. This tutorial covers the full Python API for `SubsurfModifier`: the
`crease_edge` attribute, viewport vs render level separation, and the
apply-before-GLB-export pattern that prevents the exporter from silently
delivering a low-resolution control cage.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full scripted build: bmesh panel construction, crease attribution, SubsurfModifier config, GLB export |
| `record.py` | Viewport animation: cage → L1 subdivided → L2 render-quality transition |
| `hf_console_panel.glb` | Exported hard-surface panel (baked at render_levels=2) |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |

## Key concepts

- **`mesh.attributes["crease_edge"]`** — `FLOAT` attribute on the `EDGE`
  domain, range 0–1. `foreach_set("value", array)` writes all values in one
  call, orders of magnitude faster than a Python loop.
- **`mod.use_creases = True`** — must be set for the attribute to have any
  effect; it is the default but easy to accidentally clear in the UI.
- **`mod.levels` vs `mod.render_levels`** — viewport interactivity vs output
  quality. They are independent; the GLB exporter evaluates at render_levels.
- **`mod.uv_smooth = 'PRESERVE_BOUNDARIES'`** — stops UV island edges from
  sliding inward under subdivision; critical for baked textures.
- **`mod.show_only_control_edges`** — hides the subdivided wirelines in the
  viewport. Useful when working at levels ≥ 2 on dense meshes.
- **Apply before GLB export** — glTF 2.0 carries no SubD primitive. Apply at
  render_levels=2 then export; the exporter reads the baked mesh.

## Related tutorials

- [Python Edge Sharp / Crease / Seam Attribute API](/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr)
- [Modifier Stack Pre-Export Apply](/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply)
- [SubD Crease Bevel Weight Hard Surface (UI)](/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface)
- [bmesh Hard-Surface Prop Construction](/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop)

## External sources

- Blender Manual — Subdivision Surface Modifier (CC BY SA 4.0):
  https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/subdivision_surface.html
- Blender Python API — bpy.types.SubsurfModifier (CC BY SA 4.0):
  https://docs.blender.org/api/current/bpy.types.SubsurfModifier.html
