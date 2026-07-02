# Python bpy.types.FileHandler — GLB Drag-Drop Extension Extractor

**Blender 5.1 · CC0 · Holoflow Studio**

Registers a `bpy.types.FileHandler` that intercepts OS-level `.glb` / `.gltf`
drag-drop events onto the 3D Viewport, parses the binary JSON chunk directly
with the standard library, extracts `holoflow:` extras from every node and
mesh, and injects them as `hf:` custom properties on the imported Blender
objects — before the standard glTF importer discards them.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full addon: `HF_FH_import_studio_glb` FileHandler + `HF_OT_import_studio_glb` Operator + File menu entry |
| `record.py` | Automated viewport render: simulates import appearing + property label |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for capturing the drag-drop demo |

## Quick start

```
Edit > Preferences > Add-ons > Install… → blueprint.py → Enable
```

Or paste into the Text Editor and **Run Script** to register in-session.

Drag any `.glb` from your OS file manager onto the Blender 3D Viewport.
After import, select the object and open the Properties panel (N key) >
**Custom Properties** — look for keys beginning with `hf:`.

## Studio connection

The `holoflow_webxr_exporter` add-on (`tools/blender-addon/`) writes:
- `holoflow:facet` — boolean, true → flat-shaded on export
- `holoflow:tag`   — string, route-level asset tagging
- `holoflow:lod`   — int 0–3, LOD tier

This extractor reads those values back, surviving a round-trip through a
third-party .glb file.

## Tutorial

`/tutorials/blender-tutorial-python-file-handler-gltf-drag-drop-extension-extractor`
