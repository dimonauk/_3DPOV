# LaplacianDeformModifier — Anchor-Driven Secondary Motion for VRM Accessories

**Blender 5.1 · Python bpy API · Scripting · CC0**

## What this does

Builds a tapering tail cylinder (or any VRM accessory) and deforms it with
`bpy.types.LaplacianDeformModifier` — a sparse linear solver that describes
every vertex by its Laplacian (differential) coordinate rather than its
absolute position.  Moving the tip anchor propagates a smooth, organic curve
through the entire mesh with zero weight-painting and zero physics simulation.

The exported GLB captures the peak-deflection pose (35° arc) for WebXR
staging; the `.blend` retains the full 50-frame animation for further rigging.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full procedural build + bind + animate + GLB export |
| `record.py` | WORKBENCH viewport render → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 take |
| `hf_lapdeform_tail.blend` | Generated .blend (run `blueprint.py` to produce) |
| `hf_lapdeform_tail.glb` | Draco-compressed GLB at frame 25 deflection |

## Quick start

```bash
blender --background --python blueprint.py
```

## Key concepts

- **Differential coordinates** — vertex = offset from one-ring centroid, not world position.
- **Anchor weight 1.0** — root rings are pinned; solver treats them as hard constraints.
- **Anchor weight 0.0** — tip ring is a free handle; move it with a Hook/Empty.
- **Stack order** — `HookModifier` (index 0) moves the tip; `LaplacianDeformModifier`
  (index 1) solves the full deformation.  Reversed order produces no deformation.
- **Bind** — call `bpy.ops.object.laplaciandeform_bind()` exactly once per rest pose.
  Rebind after any topology or rest-pose change.

## Outside sources

- Blender Manual — LaplacianDeform Modifier (CC-BY-SA-4.0, Blender Foundation)
  <https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/laplacian_deform.html>
- Blender Python API — bpy.types.LaplacianDeformModifier (CC-BY-SA-4.0, Blender Docs Team)
  <https://docs.blender.org/api/5.1/bpy.types.LaplacianDeformModifier.html>
- KhronosGroup/glTF-Blender-IO (Apache-2.0)
  <https://github.com/KhronosGroup/glTF-Blender-IO>

## Studio cross-references

- [Holoflow WebXR Exporter add-on](/docs/INSTALL-SCAN-BLENDER) — `holoflow:facet` flag, +Y up, Draco L6
- [HookModifier tutorial](/tutorials/blender-tutorial-python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr)
- [CorrectiveSmoothModifier tutorial](/tutorials/blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr)
