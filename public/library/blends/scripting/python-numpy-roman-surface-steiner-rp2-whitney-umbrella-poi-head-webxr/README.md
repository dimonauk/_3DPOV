# Steiner Roman Surface — RP² Immersion with Whitney Umbrellas

**Blender 5.1 · Python + numpy · CC0 · Holoflow Studio**

Jakob Steiner's 1844 immersion of the real projective plane in ℝ³,
built as a faceted poi head for WebXR via the Veronese-type sphere map.

---

## What this is

The **Roman surface** is Jakob Steiner's 1844 realisation of RP² in three-dimensional
space — discovered during a visit to Rome, hence the name. Unlike Werner Boy's 1901
smooth immersion (which has one triple point and no singularities), the Roman surface
has **six Whitney umbrella pinch points**, making it a piecewise-smooth but not fully
smooth immersion.

The six Whitney umbrellas sit at the tips of three coordinate-axis double-line segments:

| Double line | Whitney tips |
|-------------|--------------|
| X-axis      | (±SCALE/2, 0, 0) |
| Y-axis      | (0, ±SCALE/2, 0) |
| Z-axis      | (0, 0, ±SCALE/2) |

The algebraic equation in projective space RP³ is:

```
X²Y² + Y²Z² + Z²X² − XYZW = 0   (degree 4)
```

In affine ℝ³ (W=1): `x²y²  +  y²z²  +  z²x²  =  xyz`.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: Veronese mesh, vertex colours, shape keys, GLB export |
| `record.py` | Automated Workbench render: 192-frame orbit + shape-key morphs |
| `SCREEN-RECORDING-NOTES.md` | Manual OBS instructions for `screen.mp4` |
| `hf_roman_surface.blend` | *(generated)* Blender scene |
| `hf_roman_surface.glb` | *(generated)* WebXR-ready GLB with morph targets |

---

## Running

```bash
# Step 1: build mesh, shape keys, material, export GLB + .blend
blender --background --python blueprint.py

# Step 2: render viewport animation
blender --background --python record.py
```

---

## Parametrisation

For a point `p = (sin φ cos θ, sin φ sin θ, cos φ)` on S²:

```
X = SCALE · pₓ · pᵧ  =  SCALE · sin²φ · sin(2θ)/2
Y = SCALE · pᵧ · p_z  =  SCALE · sin(2φ)/2 · sin θ
Z = SCALE · p_z · pₓ  =  SCALE · sin(2φ)/2 · cos θ
```

Domain: `φ ∈ (ε, π−ε)`, `θ ∈ (ε, π−ε)`.  Poles and boundary collapse to the
self-intersection origin and double-line endpoints respectively; the ε-inset
prevents degenerate quad faces.

---

## Cross-References

- **Boy surface tutorial** `/tutorials/blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr` — complementary RP² immersion
- **Klein bottle tutorial** `/tutorials/blender-tutorial-python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr` — another non-orientable surface
- **Barth sextic tutorial** — degree-6 algebraic surface; Roman surface is degree-4

---

## Source Credits

- Steiner J (1844) "Questions proposées," *Nouvelles Annales de Mathématiques* 3, pp. 1–2. **Public Domain.**
- NumPy Developers (2020) BSD-3-Clause — numpy.org
- 3D-XplorMath Consortium (MIT) — https://3d-xplormath.org
