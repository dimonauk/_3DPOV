# Costa Minimal Surface — Holoflow Library Entry

**Topic:** scripting / minimal surfaces  
**Blender:** 5.1  
**Licence:** CC0  
**Slug:** `python-numpy-costa-minimal-surface-weierstrass-enneper-elliptic-three-ends-poi-webxr`

---

## What this is

Celso José da Costa's 1982 surface is the first complete embedded minimal surface in ℝ³ with genus 1 and three ends found since Scherk in 1835 — a 147-year gap.  David Hoffman and William Meeks proved its embeddedness (non-self-intersection) in 1985 using computer graphics.  This library entry constructs it in Blender 5.1 via the Weierstrass–Enneper representation on the **square torus ℂ/(ℤ + iℤ)**.

The blueprint produces an 8.2 cm poi head mesh with:
- **Accurate WE integration** via Eisenstein-series ℘ function (M=16, ~1088 terms)
- **Gaussian curvature vertex colour** (blue = high |K|, orange = near zero)
- **Two shape-key morphs** (Costa_Wide, Costa_Tall) for WebXR animation
- **Draco-6 GLB** export with morph targets

## Weierstrass–Enneper data

```
g(z) = A · ℘(z; ℤ + iℤ)        (Gauss map)
f(z) = 1 / ℘'(z; ℤ + iℤ)       (holomorphic 1-form coefficient)

X(z) = Re ∫ (1 − g²)f / 2  dz
Y(z) = Re ∫ i(1 + g²)f / 2  dz
Z(z) = Re ∫ gf  dz
```

The three ends arise at the zeros of ℘' (the half-periods 1/2, i/2, (1+i)/2 of the lattice).

## Integration trick

Rather than integrating on [0,1)² (where punctures appear at corners and edge midpoints), the domain is **centred on (1+i)/2** — the fourth half-period, which is not a puncture.  All three Costa ends then sit on the boundary of the (−0.5, 0.5)² square, giving a smooth, singularity-free interior.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main Blender 5.1 script — builds mesh, colours, shape keys, exports GLB |
| `record.py` | Viewport animation script — 10 s orbit + morph, outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the tutorial screen recording |
| `.expected-artefacts.json` | Expected output file list |

## Expected outputs

| Path | Description |
|---|---|
| `public/library/blends/scripting/.../hf_costa_surface.blend` | Source blend (saved manually) |
| `public/library/glbs/scripting/.../hf_costa_surface.glb` | Draco-6, morph targets, vertex colour |
| `public/library/videos/scripting/.../viewport.mp4` | 1280×720 Workbench orbit animation |
| `public/library/videos/scripting/.../screen.mp4` | 1920×1080 OBS screen capture |

## Cross-references

- [Weierstrass–Enneper Minimal Surfaces](/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr) — catenoid and Enneper via the same WE framework
- [Weierstrass ℘-Function Height Field](/tutorials/blender-tutorial-python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr) — deep dive into the elliptic function used here
- [Scherk Doubly-Periodic Minimal Surface](/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr) — the previous classical minimal surface, 1835

## Outside sources

1. **Costa, Celso J.** "Example of a complete minimal immersion in ℝ³ of genus one and three embedded ends." *Boletim da Sociedade Brasileira de Matemática* 15, no. 1–2 (1984): 47–54. — original paper (mathematical formulas, public domain as factual content)

2. **Hoffman, David, and William H. Meeks III.** "A complete embedded minimal surface in ℝ³ with genus one and three ends." *Journal of Differential Geometry* 21, no. 1 (1985): 109–127. — proof of embeddedness

3. **NumPy contributors.** NumPy Reference Documentation. BSD-3-Clause. <https://numpy.org/doc/stable/>
