# Kepler-Poinsot Star Polyhedra

**Blender 5.1 · Python + NumPy + SciPy · Holoflow Library Entry**

The four *regular star polyhedra* — discovered by Kepler in 1619 and completed
by Poinsot in 1809 — extend the five Platonic solids by allowing star-polygon
faces or star vertex figures.  Cauchy's 1813 proof that these four exhaust all
possibilities is a landmark in combinatorial topology.

---

## The four polyhedra

| Schläfli | Name | Faces | Vertex figure | V  | E  | F  | Density |
|----------|------|-------|---------------|----|----|----|---------|
| {5/2, 5} | Small Stellated Dodecahedron | pentagram {5/2} | pentagon | 12 | 30 | 12 | 2 |
| {5/2, 3} | Great Stellated Dodecahedron | pentagram {5/2} | triangle | 20 | 30 | 12 | 3 |
| {5, 5/2} | Great Dodecahedron | pentagon | pentagram | 12 | 30 | 12 | 2 |
| {3, 5/2} | Great Icosahedron  | triangle | pentagram | 12 | 30 | 20 | 7 |

*Density* counts how many times the solid wraps around its centre.  The
SSD/GSD share Kepler 1619; GD/GI were found by Poinsot 1809 and proven
complete by Cauchy 1813 (*Journal de l'École Polytechnique*, 1813).

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 Python script — builds SSD, GSD, GD, GI meshes |
| `record.py` | Viewport-animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `hf_ssd_poi.glb` | *(generated)* SSD as WebXR poi-head GLB |
| `hf_kp_all.glb` | *(generated)* All four polyhedra |
| `hf_kp_star_polyhedra.blend` | *(generated)* Blender scene |

---

## How to run

```bash
blender --background --python blueprint.py
```

Or inside Blender's Scripting workspace: open `blueprint.py`, press **Alt+P**.

---

## Visual stellation construction

The topologically exact star polyhedra self-intersect.  This blueprint uses
**visual stellation**: a spike pyramid on each face of the base polyhedron,
extended by golden-ratio multiples of the face inradius:

- **SSD** → 12 pentagonal pyramids on dodecahedron, height = φ × r_in
- **GSD** → 20 triangular pyramids on icosahedron, height = φ² × r_in

The spike tips land at the dual-face intersection points of the true star
polyhedra — the geometry is metrically equivalent from the outside, without
the interior self-intersecting faces that confuse WebGL culling.

---

## Cross-references

**Studio**
- [Schwarz P, D & Gyroid (TPMS)](/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr) — another family of highly symmetric surfaces with golden-ratio geometry
- [Hopf Fibration](/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr) — icosahedral symmetry also appears in the Hopf bundle over S²
- [Icosahedral Quasicrystal](/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr) — the same Iₕ symmetry group underlies quasicrystal diffraction
- [Barth Sextic](/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr) — icosahedral symmetry of an algebraic surface with 65 nodes

**External**
- Kepler, J. (1619). *Harmonices Mundi*. Johann Planck, Linz. Public domain. Archive.org: https://archive.org/details/harmonicesmvndi00kepl
- Poinsot, L. (1810). Mémoire sur les polygones et polyèdres. *Journal de l'École Polytechnique*, 10:16–48. Public domain. 
- Cauchy, A.L. (1813). Recherches sur les polyèdres. *Journal de l'École Polytechnique*, 9:68–86. Public domain.
- Antiprism (MIT) — polyhedra exploration toolset: https://github.com/antiprism/antiprism
- NumPy (BSD-3-Clause): https://numpy.org
- SciPy (BSD-3-Clause): https://scipy.org
