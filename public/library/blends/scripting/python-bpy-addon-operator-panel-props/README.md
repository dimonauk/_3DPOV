# Holoflow Grid Stamp — Blender 5.1 Addon Anatomy

**Topic:** scripting · **Slug:** python-bpy-addon-operator-panel-props  
**Blender:** 5.1 · **Licence:** CC0

---

## What this teaches

The complete skeleton of a Blender 5.1 Extension:

| Component | Class | Purpose |
|---|---|---|
| Settings storage | `PropertyGroup` + `PointerProperty` | Typed, undo-aware values attached to `Scene` |
| Business logic | `Operator` with `execute()` | Does the work; `REGISTER + UNDO` enables redo-panel |
| Guard | `Operator.poll()` | Greys-out the button if preconditions fail |
| UI | `Panel` | N-panel with `use_property_split` two-column layout |
| Mirror | `Operator.draw()` | Redo-panel (F9) with identical controls, zero extra code |
| Lifecycle | `register()` / `unregister()` | Class ordering and `bpy.types.Scene` attachment |

The concrete addon is **Grid Stamp**: array the active object into a configurable
X × Y grid at a user-set spacing, in XY / XZ / YZ orientation.

---

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full addon code + demo scene setup (`demo()`) |
| `record.py` | Headless viewport animation render — 4×4 grid orbiting camera, 10 s |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for recording the coding + N-panel walkthrough |
| `.expected-artefacts.json` | CI checklist |

---

## Running

### Single-file mode (learning)

1. Open Blender → Scripting workspace.
2. New text block → paste `blueprint.py`.
3. Uncomment the last line: `# demo()` → **Run Script**.
4. Switch to 3D Viewport → Numpad 7 → see the grid.
5. Press **N** → **Holoflow** tab → adjust sliders → **Stamp Grid**.

### Extension package mode (distribution)

```
holoflow_grid_stamp/
├── __init__.py        ← rename blueprint.py
└── blender_manifest.toml
```

`blender_manifest.toml`:
```toml
schema_version        = "1.0.0"
id                    = "holoflow_grid_stamp"
name                  = "Holoflow Grid Stamp"
tagline               = "Array the active object into a configurable grid"
version               = "1.0.0"
type                  = "add-on"
blender_version_min   = "4.2.0"
blender_version_max   = "5.9.9"
maintainer            = "Holoflow Studio <hello@holoflow.co.uk>"
license               = ["SPDX:Apache-2.0"]
tags                  = ["Object"]
```

Install via **Edit → Preferences → Extensions → Install from Disk** → select the folder.

---

## External sources

1. **fake-bpy-module** by Nutti — MIT — <https://github.com/nutti/fake-bpy-module>  
   Type stubs for the bpy API; demonstrates the full property/operator/panel surface.  
   Related: `blender-type-stubs`, `bpystubs` on PyPI.

2. **Blender glTF 2.0 I/O** by Julien Duroure / Khronos Group — Apache 2.0  
   <https://extensions.blender.org/add-ons/io-scene-gltf2/>  
   Production-grade addon showing real-world Operator + Panel + PropertyGroup patterns.  
   Related: KHR glTF extensions repository at <https://github.com/KhronosGroup/glTF>.

---

## Studio cross-references

- [Python bpy — Geometry Nodes Tree API](/tutorials/blender-tutorial-python-bpy-geonodes-tree-api)
- [Python bmesh — Dodecahedron](/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron)
- [Python bpy — 3D Print Mesh Analysis](/tutorials/blender-tutorial-python-3d-print-mesh-analysis)
- [tools/blender-addon/holoflow_webxr_exporter](/tools/blender-addon/)
