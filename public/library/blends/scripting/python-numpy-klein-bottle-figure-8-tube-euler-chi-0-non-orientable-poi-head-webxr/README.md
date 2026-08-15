# Klein Bottle — χ=0 Non-Orientable Poi Head

**Blender 5.1 · Python + numpy · CC0 · Holoflow Studio**

Felix Klein's 1882 closed non-orientable surface, immersed in ℝ³ as the
figure-8 tube, built as a faceted poi head for WebXR. Euler characteristic χ=0.
Self-intersection circle: the equatorial ring at z=0, radius r=2.5.

---

## What this is

The Klein bottle K is the compact, non-orientable surface with Euler
characteristic χ(K) = 0. Its topological fingerprints:

- **Fundamental polygon** `a·b·a⁻¹·b` — one pair of sides identified in
  opposite orientation, producing the Klein bottle instead of a torus.
- **Connected sum** K = RP² # RP² — two cross-caps joined. χ = 1+1−2 = 0.
- **Homology** H₀=ℤ, H₁=ℤ⊕ℤ₂, H₂=0 — the ℤ₂ torsion is the topological
  signature distinguishing K from the torus (which has H₁=ℤ⊕ℤ).
- **Not embeddable** in ℝ³ (Whitney 1944); the figure-8 tube immersion is
  the cleanest way to visualise it in three dimensions.

**Relation to the Möbius band:** cutting K along the equatorial circle
gives two Möbius bands. The non-orientability is directly inherited from
the Möbius band structure of each half.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: mesh, vertex colours, 4 shape keys, GLB export |
| `record.py` | Automated Workbench render: orbit + shape-key morphs → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_klein_bottle.blend` | *(generated)* Blender scene |
| `hf_klein_bottle.glb` | *(generated)* WebXR GLB with morph targets |

---

## Running

```bash
blender --background --python blueprint.py
blender --background --python record.py   # after blueprint.py
```

---

## Parametrisation

Domain: `u ∈ [0, 2π)`, `v ∈ [0, 2π)` — both periodic (7 200 quads, 120×60).

```
radial(u,v) = r + cos(u/2)·sin(v) − sin(u/2)·sin(2v)

x = radial · cos(u)
y = radial · sin(u)
z = sin(u/2)·sin(v) + cos(u/2)·sin(2v)

r = 2.5  →  radial ≥ 2.5 − 1.25 = 1.25 > 0  (never folds through origin)
```

**Self-intersection:** `v=0` and `v=π` both give `radial=r, z=0`, mapping to
the equatorial circle `{(r·cos u, r·sin u, 0)}`. This circle is doubly covered.

## Shape keys

| Key | Description |
|-----|-------------|
| Basis | r=2.5, standard figure-8 tube, poi scale |
| SK_Wide | r=4.0, wider tube separation |
| SK_Flat | z×0.25, flat disc revealing equatorial self-intersection |
| SK_Tall | z×2.5, xy×0.55, elongated wand-head form |

## Licence

CC0 — no rights reserved. Mathematical equations are public domain.
