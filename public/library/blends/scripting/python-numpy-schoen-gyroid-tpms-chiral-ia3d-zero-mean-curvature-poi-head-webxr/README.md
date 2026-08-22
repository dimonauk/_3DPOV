# Schoen Gyroid TPMS — Blender 5.1 Library Entry

**Slug**: `python-numpy-schoen-gyroid-tpms-chiral-ia3d-zero-mean-curvature-poi-head-webxr`  
**Category**: scripting · poi-head  
**Blender**: 5.1  
**Licence**: CC0  
**Date**: 2026-08-22

---

## What this is

The **Schoen gyroid** is a triply periodic minimal surface (TPMS) discovered by
Alan Schoen in 1970 whilst working at NASA.  It is the only member of the
associate family of Schwarz-P and D surfaces that carries no straight lines and
no mirror planes — it is therefore the simplest known chiral minimal surface.

Its nodal (single-harmonic Fourier) approximation:

```
f(x,y,z) = sin x · cos y + sin y · cos z + sin z · cos x = 0
```

The exact surface has H = 0 everywhere (zero mean curvature).  The nodal
approximation is within 1 % of the exact solution and is the standard in
3D-print and materials science use.

**Space group**: Ia-3d (cubic, body-centred, #230).  
**Genus per unit cell**: 3 (two interlocked channel networks, neither
connects to the other, so the surface separates space into two labyrinthine
but topologically equivalent volumes).

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 Python script — builds the mesh, shape keys, vertex colour, material, exports GLB |
| `record.py` | Automated viewport animation (90 frames, orbit + shape-key sweep) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar / macOS instructions for manual screen recording |
| `hf_gyroid.blend` | Saved .blend (after running blueprint.py) |
| `hf_gyroid.glb` | Draco-6 compressed GLB with WebP textures, +Y up |
| `.expected-artefacts.json` | CI manifest |

---

## Running the blueprint

Open Blender 5.1, switch to the **Scripting** workspace, open `blueprint.py`,
and press **Run Script**.  Expect ~45–90 seconds (N=60, ≈216 k voxels,
active-cell marching tetrahedra).

The script:
1. Evaluates the gyroid nodal function on an 60³ grid over [−2π, 2π]³.
2. Extracts the f=0 isosurface via marching tetrahedra (6 tets per cube).
3. Scales the result to a 8.2 cm poi-head bounding sphere.
4. Assigns cobalt-to-amber vertex colour by surface-normal z-component.
5. Adds two shape keys: `SK_LevelP4` and `SK_LevelN4` (offset surfaces ±0.4).
6. Sets Principled BSDF material (ocean blue, low emission).
7. Exports `hf_gyroid.glb` (Draco-6, WebP).

---

## Shape keys

| Key | Level | Visual effect |
|-----|-------|--------------|
| Basis | f = 0 | exact nodal gyroid |
| SK_LevelP4 | f = +0.4 | one set of channels narrows |
| SK_LevelN4 | f = −0.4 | the complementary set narrows |

Shape-key values blend continuously — scrub to any intermediate shape.

---

## Cross-references

- [Enneper surface (Weierstrass-Enneper minimal surface)](/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr)
- [Differential growth (Laplacian smooth + ruffling)](/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr)
- [Mean-curvature flow (Huisken 1984)](/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr)

---

## Outside sources

1. **Schoen AH (1970)** — *Infinite Periodic Minimal Surfaces Without Self-Intersections*.  
   NASA Technical Note D-5541.  US government work (public domain).  
   https://ntrs.nasa.gov/citations/19700020490

2. **Lord EA & Mackay AL (2003)** — *Periodic minimal surfaces of cubic symmetry*.  
   Current Science 85(3): 346–362.  Open-access journal.  
   https://www.currentscience.ac.in/Volumes/85/03/0346.pdf

3. **NumPy** (BSD-3-Clause) — https://numpy.org/
