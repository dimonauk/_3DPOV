# Custom Split Normals — Per-Loop Normal Authoring

**Blender 5.1 · Python · CC0**

Demonstrates hand-authored per-loop split normals using
`bpy.types.Mesh.normals_split_custom_set()`, the only mechanism in
Blender 5.1 for assigning truly arbitrary per-loop normals that survive
GLB export as GLTF `NORMAL` attributes.

---

## What this does

1. Builds a subdivided icosphere (320 faces) via `bmesh.ops.create_icosphere`.
2. Groups faces into smooth-shading islands using a Union-Find algorithm on
   face-normal dot products.
3. Computes per-island area-weighted average normals.
4. Stamps per-loop normals onto the mesh with `normals_split_custom_set()`.
5. Exports as GLB (Draco 6, WebP textures) ready for Three.js / WebXR.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full expert-grade script — run in Blender 5.1 Text Editor |
| `record.py` | Viewport animation render for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen capture |
| `.expected-artefacts.json` | List of expected output files |

---

## Blender 4.1 migration

`mesh.use_auto_smooth` and `mesh.auto_smooth_angle` were **removed** in 4.1.
Their replacement — the "Smooth by Angle" Geometry Nodes modifier — computes
normals at render time and overrides `normals_split_custom_set()` if present.
Do not add that modifier to a mesh that uses custom split normals.

---

## Studio cross-references

- [Faceted Gem — BMesh Topology Construction](/tutorials/blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr)
- [Shader to RGB + Halftone Cel-Shade for WebXR](/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr)
- [Modifier Stack Pre-Export Apply](/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply)
- [Python Mesh Attributes: foreach_set / foreach_get](/tutorials/blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline)

---

## Outside sources

- **Blender Foundation** — `bpy.types.Mesh` Python API reference (CC-BY-SA 4.0)  
  <https://docs.blender.org/api/5.1/bpy.types.Mesh.html>
- **Blender Foundation** — Release Notes 4.1: Auto Smooth removal (CC-BY-SA 4.0)  
  <https://wiki.blender.org/wiki/Reference/Release_Notes/4.1/Python_API>
- **Blender/io_scene_gltf2** — GLTF exporter handling of split normals (Apache-2.0)  
  <https://projects.blender.org/blender/blender/src/branch/main/scripts/addons_core/io_scene_gltf2>
