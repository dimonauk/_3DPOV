# VertexWeightEditModifier + VertexWeightMixModifier
## Custom S-Curve Weight Remap & Group Blend — VRM Cloth Pinning

**Blender**: 5.1 · **Licence**: CC0 · **Topic**: scripting / modifiers

---

### What this builds

A faceted VRM shoulder pauldron with a three-stage vertex-weight pipeline:

1. **Height gradient** — `shoulder_prox` group, 0 at base to 1 at cap
2. **S-curve remap** — `VertexWeightEditModifier` snaps the gradient to near-binary pinned/free zones
3. **Pin stripe blend** — `VertexWeightMixModifier` MULTIPLY-blends with a hand-painted rim stripe into `cloth_result`

The `cloth_result` group wires directly into a Cloth modifier as its Pin Group. The debug vertex-colour layer `debug_result` shows the final weight without running physics.

---

### Quick start

```bash
# In Blender 5.1 Script Editor
exec(open("blueprint.py").read())
```

Alternatively drag `hf_vwedit_pauldron.blend` into Blender directly (once generated).

---

### File inventory

| File | Description |
|---|---|
| `blueprint.py` | Full procedural pipeline — mesh, vertex groups, both modifiers, debug vc, GLB export |
| `record.py` | 90-frame orbital render with phase-transition modifier toggles → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup and interactive walkthrough script |
| `hf_vwedit_pauldron.blend` | Generated blend file (run blueprint.py) |
| `../../glbs/scripting/hf_vwedit_pauldron.glb` | Exported GLB |

---

### Key gotchas

**Curve mapping requires `cm.update()`** — After adding or moving control points in `map_curve.curves[0].points`, you MUST call `mod.map_curve.update()`. Omitting this leaves the modifier using stale cached handles.

**VertexWeightMix writes to `vertex_group_a` by default** — Set `result_vertex_group` to a third group name to preserve the original groups for debugging. Without it, `vertex_group_a` is overwritten in-place.

**mix_set = 'ALL' vs 'OR'** — 'ALL' assigns `default_weight_a` or `default_weight_b` to vertices absent from those groups, which can flood unrelated geometry with zero-weight entries. Use 'OR' (union of existing weights) to stay conservative.

**Modifier order matters** — `VertexWeightEditModifier` must come before `VertexWeightMixModifier` in the stack if the mix reads the remapped group. If they are swapped, VWMix reads the pre-remap raw values.

**`falloff_type = 'CURVE'` vs `'SMOOTH'`** — 'SMOOTH' applies a fixed Hermite S-shape that cannot be tuned per-project. 'CURVE' + CurveMapping gives full control over where the inflection sits and how steep each half is.

---

### Related tutorials

- Proximity weights as input: `/tutorials/blender-tutorial-python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm`
- Cloth simulation & pin groups: `/tutorials/blender-tutorial-modifier-surface-deform-vrm-cloth-binding`
- VRM deformation envelopes: `/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope`

---

### Outside sources

- Blender Foundation — VertexWeightEditModifier API — CC-BY-SA-4.0  
  <https://docs.blender.org/api/5.1/bpy.types.VertexWeightEditModifier.html>
- KhronosGroup glTF-Blender-IO — Apache-2.0  
  <https://github.com/KhronosGroup/glTF-Blender-IO>
