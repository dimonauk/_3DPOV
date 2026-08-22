# GN Deform Curves on Surface — Hair Strand Binding for VRM / WebXR

**Blender 5.1 · CC0 · Holoflow Studio**

## What this does

`GeometryNodeDeformCurvesOnSurface` re-positions HairCurves control points
every frame so they track the deformation of a bound surface mesh. When an
Armature modifier deforms the scalp mesh, the hair strands follow — purely
kinematically, no physics solver, no per-frame re-simulation.

The node reads two pieces of data from the HairCurves data block itself:
- `hc.surface` — the Object the curves are pinned to
- `hc.surface_uv_map` — the UV layer used for barycentric root lookup

Setting those two properties is the entire "bind" step. From that point the
modifier handles tracking automatically.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene build: scalp mesh, single-bone armature, 12 guide HairCurves, DeformCurvesOnSurface modifier, Curve-to-Mesh output object. Saves `deform_curves_demo.blend` and exports `deform_curves_demo_posed.glb` at pose frame 30. |
| `record.py` | EEVEE viewport animation: 90 frames (tilt forward → return → orbit). Outputs `viewport.mp4`. |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for recording `screen.mp4`. |
| `.expected-artefacts.json` | Artefact manifest with cross-reference index. |

## Running

```bash
blender --background --python blueprint.py
blender deform_curves_demo.blend --background --python record.py
```

## Key concepts

- **Rest-pose binding** — the node computes barycentric coords against the
  undeformed mesh. If you move curve roots after binding (e.g. by sculpting
  guides in Sculpt Curves mode), the binding updates on the next evaluation.
- **Deform Curves on Surface vs Interpolate Curves** — they compose: use
  Interpolate Curves to *generate* strands from guides, then add a Deform
  Curves on Surface modifier on the same Curves object to make those
  generated strands follow the rig.
- **GLB export** — GLTF has no native Curves primitive. Apply the Curve-to-Mesh
  GN modifier before export, or use a separate output mesh object as done here.

## Cross-references

- `/tutorials/blender-tutorial-gn-interpolate-curves-strand-hair-vrm` — sister
  technique that generates strands from guide curves
- `/tutorials/blender-tutorial-vrm-spring-bones-hair-chain` — runtime physics
  alternative using VRM spring bone chains
- `/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push` — baking
  armature poses to use as static snapshots for export
- `/tutorials/blender-tutorial-modifier-surface-deform-vrm-cloth-binding` —
  related surface-binding approach for cloth meshes
