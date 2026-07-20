# Python bpy.types.LaplacianSmoothModifier
## Volume-Preserving Cotangent-Weighted Smooth — VRM Panel Cleanup (Blender 5.1)

Applies **non-destructive Laplacian smoothing** to a faceted VRM body panel
that has boolean-residue topology, producing an organic silhouette while
keeping seam-ring vertices pinned via a vertex-group mask.

---

### What this demonstrates

| Property | Value used | Why |
|---|---|---|
| `iterations` | 6 | Each pass reduces residue; 4–8 sufficient for cleanup |
| `lambda_factor` | 0.5 | Taubin λ — standard Laplacian step size |
| `use_normalized` | True | Cotangent weights — area-independent, no size bias |
| `use_volume_preserve` | True | Rescales per-pass; prevents soap-bubble shrinkage |
| `vertex_group` | `smooth_mask` | Weight 0 = pinned, Weight 1 = freely smoothed |
| `use_x/y/z` | True/True/True | Uniform spatial smoothing |

---

### Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build, modifier setup, three GLB snapshots |
| `record.py` | Viewport animation rendering `iterations` 0→10 |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `hf_lapsmooth_panel.blend` | Live .blend with modifier stack intact |
| `hf_lapsmooth_panel_raw.glb` | Snapshot at iterations=0 (jagged) |
| `hf_lapsmooth_panel_iter3.glb` | Snapshot at iterations=3 |
| `hf_lapsmooth_panel_iter6.glb` | Snapshot at iterations=6 (production export) |

---

### Quick start

```bash
blender --background --python blueprint.py
blender hf_lapsmooth_panel.blend --python record.py
```

---

### Relationship to related modifiers

```
Laplacian Smooth  ← you are here: non-destructive geometry repositioning
CorrectiveSmooth  ← repairs joint deformation artefacts relative to bind pose
SmoothByAngle    ← NOT geometry — controls custom split-normal threshold only
bmesh.ops.smooth_laplacian_vert ← destructive in-bmesh equivalent
```

---

### Licence: CC0
