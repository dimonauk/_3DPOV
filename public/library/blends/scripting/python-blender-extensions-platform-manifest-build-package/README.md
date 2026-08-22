# Python — Blender 5.1 Extensions Platform

**`blender_manifest.toml` · `bl_ext` Namespace · CLI Build & Validate**

Blender 5.1 | CC0 | Holoflow Studio

---

## Technique

Blender 4.2 retired the `bl_info = {}` dictionary in favour of a typed TOML
manifest at the extension root. The Extensions Platform (extensions.blender.org)
uses that manifest for version negotiation, pip-wheel dependency bundling, and
SPDX licence enforcement. This blueprint converts the studio's legacy
`holoflow_webxr_exporter` add-on into a distributable extension and documents
every manifest field with the rationale for each choice.

Key differences from legacy add-ons:
- `blender_manifest.toml` at the extension root replaces `bl_info`
- `bl_idname = __package__` (not a hardcoded string) so it resolves correctly
  in the `bl_ext.user_default.holoflow_webxr_exporter` namespace
- Relative imports (`from . import operators`) replace flat module imports
- `blender --command extension build` produces a distributable `.zip` without
  opening the Blender UI

## What this blueprint builds

A complete re-packaging of the Holoflow exporter as a Blender 5.1 extension:

| File | Role |
|---|---|
| `blender_manifest.toml` | Identity, licence, permissions, wheel list |
| `__init__.py` | `register()` / `unregister()` entry point, keymap registration |
| `operators.py` | `HOLOFLOW_OT_export_webxr` wrapping `export_scene.gltf` |
| `preferences.py` | `HOLOFLOW_Preferences` with Draco + WebP + path settings |
| `panels.py` | N-panel UI referencing preferences |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Manifest TOML, Python modules, CLI workflow (annotated) |
| `record.py` | Render a 10-second viewport animation of the keyword cards |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen recording |

## Cross-references

### Studio

- [N-Panel Sidebar Add-on](/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar)
- [AddonPreferences + KeyMap](/tutorials/blender-tutorial-python-addon-preferences-keymap-hotkey-exporter)
- [GLB Drag-Drop Extension Extractor](/tutorials/blender-tutorial-python-file-handler-gltf-drag-drop-extension-extractor)
- [GLTF User Extension Export Hook](/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook)
- [Custom UIList Export Queue](/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue)

### External sources

| Source | Licence | Notes |
|---|---|---|
| [Blender 5.1 Extensions Manual](https://docs.blender.org/manual/en/5.1/extensions/index.html) | CC-BY Blender Foundation | Manifest schema reference |
| [SPDX Licence List](https://spdx.org/licenses/) | CC0-1.0 | Canonical SPDX identifiers for `license` field |

## Troubleshooting

**`validate` prints "bl_idname uses old format"**
→ Remove any `bl_info` dict from `__init__.py`. The manifest is the sole
identity source in extension mode.

**`bl_idname = __name__` breaks in the extension namespace**
→ Use `__package__` instead. In extension mode `__name__` resolves to
`bl_ext.user_default.holoflow_webxr_exporter.__init__`, which is not a
valid `bl_idname`. `__package__` is `bl_ext.user_default.holoflow_webxr_exporter`.

**`from holoflow_webxr_exporter import utils` fails**
→ Flat namespace imports are gone. Use `from . import utils` (relative).

**Preferences not accessible from another extension**
→ Use the full addon key:
```python
bpy.context.preferences.addons["bl_ext.user_default.holoflow_webxr_exporter"].preferences
```
