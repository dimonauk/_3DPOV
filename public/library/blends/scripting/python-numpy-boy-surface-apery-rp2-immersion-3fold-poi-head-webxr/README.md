# Boy Surface — RP² Immersion Poi Head

**Blender 5.1 · Python + numpy · CC0 · Holoflow Studio**

Werner Boy's 1901 smooth immersion of the real projective plane in ℝ³,
built as a faceted poi head for WebXR. Uses the Nordstrand/Apéry parametrisation
with no domain singularity.

---

## What this is

The real projective plane RP² is the sphere S² with antipodal points identified
(`x ~ -x`). Hilbert asked in 1901 whether RP² can be smoothly immersed (= locally
embedded but globally self-intersecting) in three-dimensional space. His student
**Werner Boy** answered yes, producing a surface with:

- exactly **one triple point** — where the surface crosses itself three times
- a **closed self-intersection curve** — one loop through the triple point
- **3-fold rotational symmetry** (Boy's original construction)

This is qualitatively better than the contemporaneous **Roman surface** (Steiner 1844),
which has six Whitney umbrella pinch points — topological singularities, not smooth.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: builds mesh, vertex colours, shape keys, GLB export |
| `record.py` | Automated Workbench render: orbit + shape-key morphs → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | Manual OBS instructions for `screen.mp4` |
| `hf_boy_surface.blend` | *(generated)* Blender scene |
| `hf_boy_surface.glb` | *(generated)* WebXR-ready GLB with morph targets |

---

## Running

```bash
blender --background --python blueprint.py
blender --background --python record.py   # after blueprint.py
```

---

## Parametrisation

Domain: `u ∈ [ε, π/2-ε]`, `v ∈ [0, 2π)` (v periodic).

```
D(u,v) = 2 − √2·sin(3u)·sin(2v)     # always ≥ 2−√2 > 0

x = (√2·cos²u·cos(2v) + cos(u)·sin(u)·cos(v)) / D
y = (√2·cos²u·sin(2v) − cos(u)·sin(u)·sin(v)) / D
z = 3·cos²u / D
```

**Key loci:**
- `u → 0`: equatorial circle at `z = 3/2` — the self-intersection ring
- `u = π/2`: the triple point at the origin
- The denominator D is always positive: no parametric singularity

---

## Shape keys

| Key | Transform | Use |
|-----|-----------|-----|
| Basis | Standard | Default poi head |
| SK_Oblate | xy×1.4, z×0.35 | Flat disc |
| SK_Prolate | xy×0.65, z×2.6 | Wand head |
| SK_Tight | uniform×0.72 | Compact for stacking |

---

## Sources

1. **Boy W** (1903). *Über die Curvatura integra und die Topologie geschlossener Flächen.*
   Mathematische Annalen 57:151–184. [Public Domain]
   https://link.springer.com/article/10.1007/BF01444342

2. **Apéry F** (1986). *An algebraic halfway model for the eversion of the sphere.*
   In: *Models of the Real Projective Plane*. Vieweg. [Mathematical content PD]
   — Introduces the degree-4 polynomial formula for Boy's surface;
   relates it to the Bryant-Kusner rational parametrisation (1987).

3. **NumPy Developers** (2020). *Array programming with NumPy.* Nature 585:357–362.
   BSD-3-Clause. https://numpy.org
