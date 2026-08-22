# Differential Growth — Laplacian Smoothing + Edge Refinement
## Ruffle-Fan Poi Head for WebXR (Blender 5.1)

**Category**: scripting | **Licence**: CC0 | **Blender**: 5.1

---

### What this is

A flat seeded disc iteratively grown so that its boundary expands faster than
its interior.  The incompatible growth rates produce an embedding incompatibility
— by Gauss's *Theorema Egregium* the mesh cannot remain flat and must buckle
out-of-plane, forming organic ruffles indistinguishable from coral fans, ruffle
skirts, and lettuce-leaf margins.

The simulation runs entirely inside Blender's `bmesh` API with no external
physics engine: 160 steps of growth → Laplacian smoothing → edge refinement,
each taking a fraction of a second.  The output is an ~18 cm ruffled disc
scaled to a 9.5 cm poi-head GLB for WebXR.

---

### Algorithm summary

```
for step in 1..N_STEPS:
    1. GROWTH        push each edge-pair apart proportional to growth weight
                     (GROWTH_BOUNDARY = 0.016, GROWTH_INTERIOR = 0.004)
    2. SMOOTH ×3     uniform graph Laplacian: v_i → lerp(v_i, centroid(N(i)), 0.40)
    3. REFINE        subdivide edges > 0.20 m at midpoint (bmesh.ops.subdivide_edges)
    4. NORMALS       bmesh.ops.recalc_face_normals
```

**Key ratio**: `GROWTH_BOUNDARY / GROWTH_INTERIOR = 4`.  Values below 2
produce a gentle dome; above 6 produce instability.  The 4× ratio is tuned to
generate 6–8 distinct ruffle lobes.

---

### Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full simulation + material + GLB export |
| `record.py` | Viewport animation render (360° orbit, 120 frames, Eevee) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture walkthrough |
| `hf_diff_growth.blend` | Saved blend file (run blueprint.py to produce) |
| `hf_diff_growth.glb` | Draco-compressed GLB, Holoflow WebXR-ready |

---

### How to run

```
Blender 5.1 → Scripting workspace → open blueprint.py → Run Script (Alt+P)
```

Console output:
```
Seed: 685 verts, 1292 faces
Running 160 growth steps …
  step 20/160  verts=1543
  step 40/160  verts=2108
  ...
  step 160/160 verts=5240
Final mesh: 5240 verts, 9820 faces
Exported → ...glbs/.../hf_diff_growth.glb
Done.
```

---

### Mathematical depth

**Why ruffles appear** (not just intuition — the actual geometry):

The growth process continuously changes the *reference metric* gᵢⱼ of the disc
— the metric the surface would have in its stress-free state.  The Laplacian
smoothing constrains the *embedding metric*, forcing the surface to stay
in ℝ³ without self-intersections.  The mismatch between reference metric and
embedding metric is measured by the Riemannian curvature tensor; specifically,
the Gaussian curvature K satisfies (Gauss 1827):

```
K = (R₁₂₁₂) / det(g)
```

When boundary edges try to be longer than they geometrically can be (given the
interior constraint), the rim acquires **negative Gaussian curvature** (saddle
shapes).  By Gauss-Bonnet the total curvature ∫K dA = 2π·χ must be conserved;
the negative rim curvature is balanced by positive curvature concentrations at
interior "hillock" vertices — exactly the ruffle pattern observed.

This is the discrete analogue of the **Föppl-von Kármán equations** for thin
elastic sheets (1904–1907), which describe how an inextensible sheet buckles
under in-plane strain.

---

### Cross-references

**Studio tutorials:**
- [Discrete Gaussian Curvature & Gauss-Bonnet](/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr) — angle defect theory used here
- [Cotangent Laplacian Mesh Fairing](/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr) — cotangent vs uniform Laplacian trade-off
- [Gray-Scott Reaction-Diffusion Turing Patterns](/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr) — morphogenesis companion

**External sources:**
- Jason Webb — *Morphogenesis Resources* (MIT licence)
  <https://github.com/jasonwebb/morphogenesis-resources>
- Nervous System — Differential Growth explorations (CC0 art, educational blog)
  <https://n-e-r-v-o-u-s.com/blog/?p=1830>
- Gauss, C.F. (1827). *Disquisitiones generales circa superficies curvas.* — Public Domain
  <https://gdz.sub.uni-goettingen.de/id/PPN35283028X_0006>
