# bpy.types.VertexGroup — Scripted Weight Assignment, Group Merging & VRM Envelope Bake

Blender 5.1 | Holoflow Studio | CC0

## What this teaches

`bpy.types.VertexGroup` is the Python handle to the vertex-weight data that
drives armature deformation, Geometry Nodes masking, physics pinning, and
modifier stacking. Unlike bone envelopes — which are evaluated at runtime from
bone geometry — vertex groups are explicit per-vertex float values baked into
the mesh data block. They survive `.blend` save, GLB export, and VRM conversion
intact.

This blueprint covers the complete scripting API:

- `ob.vertex_groups.new(name=…)` — create groups matching bone names
- `vg.add([vert_idx], weight, 'REPLACE')` — assign weights; REPLACE vs ADD vs SUBTRACT explained
- `me.vertices[i].groups` — read back `VertexGroupElement` objects
- `vg.weight(vert_idx)` — direct per-vertex lookup
- `vertex_group_normalize_all()` + `vertex_group_clean()` — VRM-required finalisation
- `paint.weight_from_bones(type='ENVELOPES')` — envelope bake as an alternative strategy

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Expert reference script — run in Blender Script Editor or `--background` |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest for CI |

## Expected artefacts (after running blueprint.py)

- `vertex_group_vrm_proxy.glb` — skinned mesh with JOINTS_0/WEIGHTS_0 attributes
- `vertex_group_vrm_proxy.blend` — source scene

## Outside sources

- Blender Foundation `bpy.types.VertexGroup` API reference (CC-BY-SA 4.0)
  <https://docs.blender.org/api/5.1/bpy.types.VertexGroup.html>
  Sibling: <https://projects.blender.org/blender/blender-extensions>

- VRM Consortium `vrm-specification` (MIT) — skin weight normalisation requirement
  <https://github.com/vrm-c/vrm-specification>
  Sibling: <https://github.com/vrm-c/UniVRM>

## Studio links

- `/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope`
- `/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm`
- `/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting`
- `/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend`
