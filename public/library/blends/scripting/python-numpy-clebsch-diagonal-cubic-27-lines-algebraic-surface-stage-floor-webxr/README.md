# Clebsch Diagonal Cubic — All 27 Real Lines Stage Floor (Blender 5.1)

A stage floor tile sculpted from the **Clebsch diagonal cubic** — the unique
smooth degree-3 algebraic surface whose **all 27 lines are real**.  Alfred
Clebsch proved in 1871 that no other smooth cubic surface achieves this
maximum.  The 27 straight lines appear as ridges across the tile surface.

---

## What makes this special

Every smooth cubic surface in projective 3-space contains exactly 27 lines
over the complex numbers.  Over the real numbers, the count of real lines
varies: it can be 3, 7, 15, or 27.  The **Clebsch cubic** is the unique
smooth cubic (up to projective equivalence) that achieves the maximum of 27
real lines.

The surface owes its special status to its **S₅ symmetry**: it arises as the
image of the locus Σxᵢ³=0, Σxᵢ=0 in P⁴, which is invariant under all
permutations of the five coordinates.  The 27 lines are indexed by the root
system **E₆**, and the Weyl group W(E₆) (order 51 840) acts on them.

---

## Equation

```
f(x,y,z) = x³ + y³ + z³ + 1 − (x+y+z+1)³  =  0
```

Derived by setting x₄ = −(x₀+x₁+x₂+x₃) and x₃ = 1 in the symmetric form.

**Key simplification**: the z³ terms from z³ and from −(x+y+z+1)³ cancel,
making f **quadratic** in z for each fixed (x,y).  This enables an efficient
height-field solver as an alternative to the full volumetric approach.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy + numpy script; run in Blender's Script Editor |
| `record.py` | Turntable animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `.expected-artefacts.json` | CI / checklist of expected output files |

Generated outputs (not committed):
- `clebsch_cubic.blend` — full scene
- `clebsch_cubic.glb` — Draco-compressed WebXR stage floor
- `viewport.mp4` — 3-second turntable animation

---

## How to run

1. Open Blender 5.1.
2. **Scripting** workspace → Text ▸ Open → select `blueprint.py`.
3. File ▸ Save As → save to this directory (so `//` paths resolve correctly).
4. Press **Run Script** (Alt+P).

Expect ~4–6 s for N = 90 on a 2024 desktop CPU.

---

## The 27 lines

In wireframe mode, the 27 lines appear as nearly-straight sequences of mesh
edges cutting across the tile.  Three of them — projections of x=y, x=z, y=z
in the symmetric coordinate system — are immediately visible from above.

The 27 lines connect at **15 Eckardt points** (each Eckardt point is where
exactly three of the 27 lines concur, forming a "triple intersection").

---

## Cross-references

**Studio**
- `/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr` — degree-6 surface with 65 nodes, same Surface Nets technique
- `/tutorials/blender-tutorial-python-numpy-kummer-quartic-surface-stage-floor-webxr` — degree-4 with 16 nodes, also a stage floor
- `/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr` — Surface Nets algorithm foundation
- `/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr` — E₆ root-system connection via 4D geometry

**Outside sources**
- Clebsch, A. (1871). J. für die reine und angewandte Mathematik 75. **Public Domain**.
- IMAGINARY/surfer-alggeo (Stephan Endraß). **Apache-2.0**.
  https://github.com/IMAGINARY/surfer-alggeo

---

## Licence
Blueprint and all authored files: **CC0 1.0 Universal** (public domain dedication).
The Clebsch cubic equation is a 19th-century mathematical theorem — no copyright applies.
