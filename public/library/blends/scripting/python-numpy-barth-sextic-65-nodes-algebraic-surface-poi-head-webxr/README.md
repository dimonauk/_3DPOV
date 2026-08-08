# Barth Sextic — 65-Node Icosahedral Algebraic Surface Poi Head (Blender 5.1)

A faceted poi head sculpted from the **Barth sextic**, a degree-6 real algebraic
surface that achieves the theoretical maximum of **65 ordinary double points** (A₁
nodes).  Wolf Barth proved in 1996 that no degree-6 surface over ℝ can have more.

---

## What makes this special

The 65 nodes manifest as **conical singularities** — two sheets of the surface
meet at a point with a cone-like tangent structure rather than a smooth tangent
plane.  At our mesh resolution (N = 100) these appear as sharp spike-tips across
the surface, creating a geometry that looks carved rather than grown.

The symmetry group is **Ih** (full icosahedral symmetry, order 120), the same
group as the icosahedron and the dodecahedron.  This is why the golden ratio
`φ = (1+√5)/2` appears in the equation — the icosahedron's edge-to-diagonal
ratio is exactly `1:φ`.

---

## Equation

```
f(x,y,z) = 4(φ²x²−y²)(φ²y²−z²)(φ²z²−x²) − (1+2φ)(x²+y²+z²−1)²  =  0
```

`(1+2φ) = 2+√5 ≈ 4.236`

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy + numpy script; run in Blender's Script Editor |
| `record.py` | Viewport animation → `viewport.mp4` (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `.expected-artefacts.json` | CI / checklist of expected output files |

Generated outputs (not committed):
- `barth_sextic.blend` — full scene
- `barth_sextic.glb` — Draco-compressed WebXR asset
- `viewport.mp4` — 3-second turntable render

---

## How to run

1. Open Blender 5.1.
2. **Scripting** workspace → Text ▸ Open → select `blueprint.py`.
3. Set the blend file save location (`File ▸ Save As`) to this directory so
   `//` paths resolve correctly.
4. Press **Run Script** (Alt+P).

Expect ~10 s for N = 100 on a 2024 desktop CPU.

---

## Cross-references

**Studio**
- `/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr` — Surface Nets algorithm (same technique, different SDF)
- `/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr` — algebraic 3D isosurface from a power-series formula
- `/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr` — the binary icosahedral group (same Ih symmetry)
- `/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr` — SDF evaluation and GLB pipeline for poi heads

**Outside sources**
- Barth, W. (1996). J. Algebraic Geometry 5(1):173–186. **Public Domain**.
- IMAGINARY/surfer-alggeo (Stephan Endraß). **Apache-2.0**.
  https://github.com/IMAGINARY/surfer-alggeo

---

## Licence
Blueprint and all authored files: **CC0 1.0 Universal** (public domain dedication).
The Barth sextic equation is a mathematical fact — no copyright applies.
