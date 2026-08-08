# Weaire-Phelan Foam — A15 Voronoi Cells, Kelvin's Conjecture & Poi Head for WebXR

**Blender 5.1 · Python + scipy · CC0**

## What this is

In 1887, Lord Kelvin asked a deceptively simple question: how do you partition
three-dimensional space into equal-volume cells with the least total surface area?
Kelvin proposed the **bitruncated cubic honeycomb** — a lattice of truncated
octahedra — and conjectured it was optimal.

For 107 years, nobody found anything better.

Then in 1994, Denis Weaire and Robert Phelan — using a computer search over
**A15 crystal lattices** — found a structure that beats Kelvin's honeycomb by
0.3 % in surface area.  Not much, but enough to overturn a century-old conjecture.

The Weaire-Phelan structure has two cell types in a 2:6 ratio per unit cell:

| Type | Name              | Faces | Symmetry  |
|------|-------------------|-------|-----------|
| A    | Pyritohedron      | 12    | Th (pyrite-like) |
| B    | Tetrakaidecahedron | 14    | D₂h      |

This blueprint builds both cell types by computing the 3-D Voronoi tessellation
of the **A15 (Cr₃Si) crystal lattice** seed points, then exports an 8-cell unit
cell as a GLB poi head for WebXR.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main bpy script — Voronoi construction, materials, shape keys, GLB export |
| `record.py` | Viewport animation — camera orbit + shape-key ramp → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Quick start

```bash
# From the Blender 5.1 Python console or --python flag:
bpy.ops.script.python_file_run(filepath="blueprint.py")
```

Requires `scipy` in Blender's Python environment:
```bash
/path/to/blender/python3.12 -m pip install scipy
```

## Cross-references

- [Gyroid TPMS tutorial](/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr) — level-set approach for zero-mean-curvature surfaces; contrast with Voronoi cell construction here
- [Wigner-Seitz BCC/FCC tutorial](/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr) — same `scipy.spatial.Voronoi` workflow on a different crystal lattice
- [Thomson Problem tutorial](/tutorials/blender-tutorial-python-numpy-scipy-thompson-problem-coulomb-energy-tammes-s2-poi-head-webxr) — energy minimisation geometry, kinship to Kelvin's area-minimisation problem
- [Scherk minimal surface tutorial](/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr) — doubly-periodic minimal surfaces; the Weaire-Phelan partition surface is also area-minimising

## Outside sources

1. **Weaire, D. & Phelan, R. (1994)** — "A counter-example to Kelvin's conjecture on minimal surfaces."
   *Philosophical Magazine Letters* 69(2):107–110.  
   [DOI: 10.1080/09500839408241577](https://doi.org/10.1080/09500839408241577)  
   Licence: Academic journal — cited for attribution; algorithm implemented independently.

2. **SciPy Spatial — Voronoi class** (BSD-3-Clause)  
   [https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.Voronoi.html](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.Voronoi.html)  
   Related: [scipy/scipy](https://github.com/scipy/scipy)

3. **Wikipedia: Weaire-Phelan structure** (CC BY-SA 4.0 / text only, not code)  
   [https://en.wikipedia.org/wiki/Weaire%E2%80%93Phelan_structure](https://en.wikipedia.org/wiki/Weaire%E2%80%93Phelan_structure)  
   Related coordinate tables used to validate the A15 seed positions.

## Notes

- The Water Cube (National Aquatics Centre, Beijing 2008 Olympics) used the Weaire-Phelan structure
  as the basis for its ETFE façade grid — a direct engineering application of this geometry.
- Whether Weaire-Phelan is provably the *global* optimum remains an open question (as of 2026).
- The shape keys demonstrate cell-volume changes; in a real soap foam, pressure equalisation
  (Laplace pressure, Young-Laplace equation) governs these morphologies.
