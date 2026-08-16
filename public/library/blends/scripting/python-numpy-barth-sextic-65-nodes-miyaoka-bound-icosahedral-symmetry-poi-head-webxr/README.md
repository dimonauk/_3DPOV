# Barth Sextic — 65-Node Degree-6 Algebraic Surface Poi Head

**Slug:** `python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr`
**Blender version:** 5.1  
**Topic:** Algebraic geometry — maximum-node surfaces, icosahedral symmetry
**Licence:** CC0 (mathematical content + studio implementation)

---

## What this is

The **Barth Sextic** is the degree-6 algebraic surface in ℝ³ with the maximum number of
ordinary double points (nodes) permitted by the Miyaoka bound: **65 real nodes**.
Discovered by Wolf Barth in 1996, it has the full icosahedral symmetry group Iₕ (order 120).

The implicit equation (affine form):

```
f(x,y,z) = 4(φ²x²−y²)(φ²y²−z²)(φ²z²−x²) − (1+2φ)(x²+y²+z²−1)²  =  0
```

where φ = (1+√5)/2 ≈ 1.618 is the golden ratio.

---

## Relation to other studio algebraic surfaces

| Degree | Name | Max nodes | Studio entry |
|--------|------|-----------|--------------|
| 3 | Clebsch cubic | 4 (smooth — 27 lines instead) | `python-numpy-clebsch-diagonal-cubic-…` |
| 4 | Kummer quartic | 16 | `python-numpy-kummer-quartic-16-nodes-…` |
| 5 | Togliatti quintic | 31 | (planned) |
| **6** | **Barth sextic** | **65** | **this entry** |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script: marching-tetrahedra isosurface + vertex colour + shape keys + GLB export |
| `record.py` | Viewport animation render script (240 frames, 10 s) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for the tutorial screen recording |
| `hf_barth_sextic.blend` | Saved .blend (produced by `blueprint.py`) |
| `hf_barth_sextic.glb` | WebXR-ready GLB (Draco-6, +Y up, WebP) |

Videos land in `public/library/videos/scripting/<slug>/`.

---

## Running

```bash
# In Blender 5.1 Python console or Scripting workspace:
exec(open("blueprint.py").read())

# Then for the recording:
exec(open("record.py").read())
```

Expected output: `XXXXX vertices, YYYYY triangles` followed by `GLB exported`.

---

## Outside sources

1. **Barth W (1996)** "Two projective surfaces with many nodes, admitting the symmetry of
   the icosahedron." *Journal of Algebraic Geometry* 5(1):173–186. — Mathematical content
   is public domain (algebraic formulae and theorems are not copyrightable). Related work:
   Endraß S (1997) "Flächen mit vielen Doppelpunkten"; Togliatti E G (1940) quintic with 31
   nodes; Miyaoka Y (1984) node-count bound via Noether formula.
   
2. **NumPy Developers** (2020) "Array programming with NumPy." *Nature* 585:357–362.
   BSD-3-Clause — https://numpy.org — vectorised meshgrid for N³ field evaluation;
   active-cell filter (`argwhere`) for sparse marching-tets traversal; gradient computation
   for the node-proximity colour map. Related: https://github.com/numpy/numpy; SciPy for
   algebraic root-finding; matplotlib for f-level-set 2D cross-sections.
