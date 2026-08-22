# Python bpy.types.glTF2ExportUserExtension
## Holoflow Facet Tag — glTF Extras Export Hook
### Blender 5.1 | CC0

---

## What this is

A self-contained Blender add-on module that hooks the built-in glTF 2.0
exporter to inject `{"holoflow:facet": 1}` into the `extras` object of
every mesh node tagged with `holoflow:facet = 1`.  The property travels
inside the binary glTF (`.glb`) and surfaces in Three.js as
`mesh.userData["holoflow:facet"]` with no post-processing step.

This is the export leg of the pipeline:
- Viewport tagging → [GizmoGroup overlay tutorial](/tutorials/blender-tutorial-python-gizmo-group-custom-viewport-handle)
- Toolbar tagging → [WorkSpaceTool facet tag tutorial](/tutorials/blender-tutorial-python-workspace-tool-custom-toolbar-facet-tag)
- **Extras injection → this tutorial**

---

## Extension discovery mechanism

```
File > Export > glTF 2.0
  └─ io_scene_gltf2 exporter
       └─ bpy.types.glTF2ExportUserExtension.__subclasses__()
            └─ HOLOFLOW_FacetExtrasExportHook  ← discovered here
```

`bpy.utils.register_class(HOLOFLOW_FacetExtrasExportHook)` in your add-on's
`register()` is sufficient — the exporter finds all subclasses automatically.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full add-on: export hook, N-panel sidebar, toggle operator |
| `record.py` | Viewport animation render (Workbench, 120 frames → viewport.mp4) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

---

## Available hook methods

| Method | Fires | Use for |
|--------|-------|---------|
| `gather_node_hook(gltf2_node, blender_object, export_settings)` | Once per node | Object-level extras |
| `gather_mesh_hook(gltf2_mesh, blender_mesh, blender_object, …)` | Once per mesh data-block | Mesh-level extras, shared geometry |
| `gather_gltf_extensions_hook(gltf2_plan, export_settings)` | Once per export | Asset-level manifest |
| `gather_joint_hook(gltf2_node, blender_bone, blender_object, …)` | Once per bone | Skeleton metadata |
| `gather_animation_hook(gltf2_animation, blender_action, …)` | Once per action | Animation metadata |

---

## glTF extras → Three.js userData

```js
loader.load("scene.glb", (gltf) => {
  gltf.scene.traverse((obj) => {
    if (obj.userData["holoflow:facet"]) {
      // activate faceted geometry or facet shader
    }
  });
});
```

---

## Outside sources

- Blender Foundation — *Import-Export: glTF 2.0 format — Extensions* — CC-BY
  https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- Three.js — *GLTFLoader / userData* — MIT
  https://threejs.org/docs/#examples/en/loaders/GLTFLoader

---

## Tutorial

`/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook`
