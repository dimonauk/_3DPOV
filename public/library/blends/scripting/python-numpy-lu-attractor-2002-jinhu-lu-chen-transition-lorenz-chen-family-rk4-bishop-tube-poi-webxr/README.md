# Lü Attractor — Jinhu Lü & Guanrong Chen, 2002

**Type**: blend + glb · **Topic**: scripting · **Blender**: 5.1 · **Licence**: CC0

---

## What this is

The Lü attractor is the "transition attractor" deliberately engineered by
Jinhu Lü and Guanrong Chen (2002) to sit at the exact boundary between the
Lorenz and Chen families of autonomous three-dimensional ODE systems.

```
ẋ = a(y − x)         a = 36
ẏ = −xz + cy         b = 3
ż = xy − bz          c = 20
```

The `ẏ = −xz + cy` form is unique among the three canonical attractors: Lorenz
has an additional `(ρ−1)x` term; Chen has `(c−a)x + cy`. The Lü form is the
one where those two extra contributions cancel — it is the isola point where
neither Lorenz-like nor Chen-like topology dominates.

---

## Mathematical properties (canonical parameters)

| Property | Value |
|----------|-------|
| Divergence ∇·F | −19 (constant) |
| Equilibria | O=(0,0,0), C±=(±√60, ±√60, 20) |
| λ₁ (max Lyapunov) | ≈ +1.508 |
| λ₃ (min) | ≈ −20.508 |
| Liouville check ∑λᵢ | ≈ −19 ✓ |
| D_KY (Kaplan-Yorke) | ≈ 2.074 |
| Dissipation rate | e^{−19t} |

---

## Shape keys

| Key | Parameters | Character |
|-----|-----------|-----------|
| Basis | a=36, b=3, c=20 | Canonical Lü — neither Lorenz nor Chen |
| SK_LowC | a=36, b=3, c=14 | Period-2 limit cycle (below Hopf threshold) |
| SK_HighC | a=36, b=3, c=28 | Dense chaos approaching Chen topology |
| SK_LowA | a=20, b=3, c=20 | Weaker coupling, broader orbit shape |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Pure-bpy Blender 5.1 script — run in Scripting workspace |
| `record.py` | Animation render script for viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest |

Expected outputs: `lu_attractor.blend` · `lu_attractor.glb` (Draco 6, WebP)
Video outputs (run manually): `viewport.mp4` · `screen.mp4`

---

## Running

```python
# In Blender 5.1 Scripting workspace:
exec(open("blueprint.py").read())
```

Then export via File → Export → glTF 2.0 with:
- Draco compression Level 6
- Format: glTF Binary (.glb)
- +Y Up
- Apply Transforms
- Include Custom Properties (for `holoflow:facet`, `holoflow:category`)

---

## Related

- Tutorial page: `/tutorials/blender-tutorial-python-numpy-lu-attractor-2002-jinhu-lu-chen-transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr`
- Chen attractor: `/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr`
- Original Lorenz: `/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr`

---

## Source

Lü J, Chen G (2002). "A new chaotic attractor coined."
*Int. J. Bifurcation Chaos* 12(3):659–661. DOI 10.1142/S0218127402004620.
Mathematical content in the public domain.
