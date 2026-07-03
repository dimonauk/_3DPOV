# Python Driver API — Bone-Rotation-to-Shape-Key Corrective Blend Shape

**Topic:** Scripting · Driver API · Shape Keys  
**Blender version:** 5.1  
**Licence:** CC0  
**Category:** scripting  
**Slug:** `python-fcurve-driver-shape-key-bone-rotation-vrm`

## What this builds

A two-bone VRM arm rig with a skin sleeve mesh whose `elbow_corrective` shape
key fires automatically as the forearm bends to -90°.  The shape key is driven
by a SCRIPTED driver reading the forearm's `LOCAL_SPACE ROT_X`, normalised into
`[0, 1]` via a clamped linear ramp expression.  Because the GLB exporter does
not resolve live drivers, the pipeline bakes 60 frames of driven values to
explicit FCurve keyframes before export.

Exports as `elbow_corrective_rig_baked.glb` (Draco 6, +Y up, 60-frame morph
animation).

## Key concepts

- **driver_add(path)** — attaches a `Driver` FCurve to any animatable RNA
  property; here called on `mesh_obj.data.shape_keys` (the `Key` ID block).
- **TRANSFORMS variable** — reads a bone transform (position, rotation, scale)
  in `LOCAL_SPACE`, `POSE_SPACE`, or `WORLD_SPACE`.
- **SCRIPTED expression** — an `eval()`d Python math expression referencing
  named driver variables; the only type that supports non-linear remapping.
- **driver_remove(path)** — removes the live driver after baking so the action
  FCurves are the sole source of truth for the GLTF exporter.
- **evaluated_get(depsgraph)** — returns the evaluated (post-modifier,
  post-driver) version of any object; used to read the driven value at each
  frame during the bake loop.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full build script; run headlessly in Blender |
| `record.py` | Viewport animation: forearm bends, camera orbits |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest and cross-references |

## Running

```bash
blender --background --python blueprint.py
# then record viewport:
blender --background elbow_corrective_rig.blend --python record.py
```

## Expected output stats

| Metric | Value |
|---|---|
| Shape keys | 2 (Basis + elbow_corrective) |
| Mesh vertices | 56 (7 rings × 8 segments) |
| Baked morph keyframes | 60 |
| GLB file size | ~8-12 KB (Draco 6, no texture) |

## Tuning

- **BEND_REST = -0.4**: delay corrective onset — useful for looser clothing mesh
- **BEND_FULL = -math.pi * 0.6**: extend full-bend threshold for hyper-flex
- **SEGS = 16**: more ring segments → smoother corrective deformation on export
- **Multiple correctives**: add `shoulder_corrective`, `wrist_corrective` with
  separate drivers on the relevant bones; each calls `driver_add` on its own
  shape key path
