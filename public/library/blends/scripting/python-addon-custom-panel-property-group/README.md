# Python — Blender Add-on: Custom Panel + PropertyGroup + Operator

**Blender 5.1 · Scripting · CC0**

Teaches every structural pattern required to author a Blender 5.1 extension:

1. **`PropertyGroup`** — bundle custom properties under one namespace and attach
   them to any ID type (`Scene`, `Object`, `Material`, …) via `PointerProperty`.
2. **`bpy.props`** — `FloatProperty`, `IntProperty`, `EnumProperty` with min/max,
   step, unit, and description metadata.
3. **`Panel`** — N-sidebar panel in the 3D Viewport with `bl_category` tab.
4. **`Operator`** — `poll()` classmethod, `execute()`, `bl_options UNDO`,
   idempotent modifier stack management.
5. **`register()` / `unregister()`** — dependency-ordered class registration,
   `PointerProperty` attachment, safe teardown.
6. **Extensions Platform** — `blender_manifest.toml` for Blender 4.2+ / 5.1
   distribution (supersedes `bl_info` for new work).

The result is **Holoflow Quick Facet**: a one-click flat-shade + bevel tool
that follows the same architectural pattern as `tools/blender-addon/holoflow_webxr_exporter`.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | The complete extension source — run via Alt+P or install from disk |
| `record.py` | Headless scene + orbit render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable artefact list + cross-references |

Installable extension lives at:
`tools/blender-addon/holoflow_extensions/quick_facet/`

---

## Quick start

```bash
# Run headlessly to produce the viewport.mp4 recording:
blender --background --python record.py

# Install the extension into a live Blender session:
# Preferences → Get Extensions → Install from Disk
# → tools/blender-addon/holoflow_extensions/quick_facet/__init__.py
```

Or paste `blueprint.py` into the **Scripting** workspace Text Editor and press **Alt+P**.

---

## Key concepts

### PropertyGroup vs. loose ID properties

`bpy.types.Scene.my_float = FloatProperty(...)` works but pollutes the global
Scene type — every .blend loaded in that session sees the property, even if they
don't use it.  A `PropertyGroup` scopes the properties under one attribute
(`scene.hf_facet.*`) and is far easier to version and unregister cleanly.

### `bl_options = {"REGISTER", "UNDO"}`

`REGISTER` puts the operator into the **Adjust Last Operation** panel (F9)
so the user can tweak parameters after clicking Apply.  `UNDO` inserts a step
into Blender's undo stack — without it, Ctrl+Z skips the operation entirely.

### Idempotent modifier management

The operator calls `ob.modifiers.get("HF_Bevel")` before adding a new modifier.
Running the same operator twice updates the existing modifier's values rather
than adding a duplicate.  This is essential for any operator the user might
run iteratively.

### Blender 5.1 Extensions Platform

Blender 4.2 replaced the legacy Add-ons system with the **Extensions Platform**.
New work should include `blender_manifest.toml` (see `quick_facet/`) alongside
the Python source.  The old `bl_info` dict still works for backward compat but
is not indexed by the extensions platform.

---

## Outside sources

- **Blender Developer Docs — Add-on Tutorial** (CC0):
  https://docs.blender.org/api/current/info_tutorial_addon.html
- **Blender Extensions Platform docs** (CC0):
  https://docs.blender.org/manual/en/latest/extensions/getting_started.html
- **Blender bpy.props reference** (CC0):
  https://docs.blender.org/api/current/bpy.props.html

---

## Holoflow cross-references

- Source code for the studio's full exporter:
  `tools/blender-addon/holoflow_webxr_exporter/`
- bmesh scripting foundations: `/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron`
- GN tree API scripting: `/tutorials/blender-tutorial-python-bpy-geonodes-tree-api`
- 3D print mesh analysis: `/tutorials/blender-tutorial-python-3d-print-mesh-analysis`
