# Python Custom ShaderNode + NodeSocket  
**HF Export Diagnostics Node for the Shader Editor — Blender 5.1**

---

## What this teaches

Every node in Blender's Shader Editor — Principled BSDF, Image Texture, Mix
Shader — is a Python class registered with `bpy.utils.register_class()`.  This
blueprint shows how to write your own.

`bpy.types.ShaderNode` is the base class for custom Shader Editor nodes.
Subclass it, declare output sockets via `init()`, draw inline UI via
`draw_buttons()`, react to tree changes via `update()`, and register an Add-menu
category via `nodeitems_utils.NodeCategory`.

The node built here interrogates the material that owns its tree and checks three
Holoflow WebXR export constraints:

| Check | What it verifies |
|---|---|
| **WebP Ready** | All Image Texture nodes reference `.webp` files |
| **UV Valid** | UV Map nodes (if present) are wired to a downstream node |
| **BSDF OK** | At least one Principled BSDF is connected to Material Output |

Socket pins change colour — green for pass, red for fail — so status is visible
at a glance in the node graph without reading any label text.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full implementation: socket class, node class, diagnostic logic, menu registration |
| `record.py` | Renders a 120-frame viewport animation (sphere cycling green → amber → red) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 screencast |
| `.expected-artefacts.json` | Expected outputs checklist |

## Studio connections

- [Export Queue UIList panel](../../../components/tutorials/entries/blender-tutorial-python-bpy-collection-property-uilist-export-queue.tsx) — batch export driver that reads the socket values
- [GLTF User Extension hook](../../../components/tutorials/entries/blender-tutorial-python-gltf-user-extension-export-extras-hook.tsx) — the downstream consumer of per-material export data
- [Shader Node Group batch material](../../../components/tutorials/entries/blender-tutorial-python-shader-node-group-batch-material.tsx) — Node GROUP manipulation via Python vs this tutorial's custom node TYPE

## Blender 5.1 compatibility

`nodeitems_utils` ships with Blender 5.1 as a bundled legacy module.  It is
not deprecated in 5.1; the successor is the `bpy.types.NodeTree.interface` API
used by Geometry Nodes node tools (a different system).  Shader Editor custom
nodes still use `nodeitems_utils` in 5.1.
