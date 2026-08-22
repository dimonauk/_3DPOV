# 600-Cell: Binary Icosahedral Group Stereographic Shadow

**Blender 5.1 · Python numpy · WebXR GLB · CC0**

## What this is

The 600-cell is the 4D analogue of the icosahedron — the most beautiful
of the six regular 4-polytopes. Its 120 vertices are simultaneously the
120 elements of the **binary icosahedral group** 2I, the unique non-abelian
subgroup of the unit quaternions of order 120. Every vertex sits on the
3-sphere S³; every edge connects a quaternion to one of its 12 nearest
neighbours at angular separation π/5.

This blueprint generates the 120 vertices from first principles (three
families of coordinates involving the golden ratio φ), finds all 720 edges
via a KD-tree distance query, and projects the polytope into ℝ³ using
**stereographic projection** from the north pole of S³. Straight 4D edges
become **circular arcs** in 3D — a consequence of stereographic projection
being conformal (angle-preserving) but not geodesic-preserving.

The resulting shadow looks like nested, compressed dodecahedra: the
innermost cell appears at full scale; successive shells grow denser as they
approach the horizon, mirroring the Poincaré ball model of hyperbolic
space.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full generation + Blender scene + GLB export |
| `record.py` | 8-second animated 4D rotation render |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen capture |
| `.expected-artefacts.json` | Output manifest |

## Expected output

```
hf_600cell.glb   — 120 vertices, 720 edges, Draco-6 compressed, WebP textures
```

## Running

```bash
blender --python blueprint.py
```

Or open Blender, go to the Scripting workspace, paste `blueprint.py`, run.

## Cross-references

- `/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr`
  — the Hopf fibration also lives on S³; the 600-cell vertices are the
  fibres' base points
- `/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr`
  — great circles on S³ project to torus knots under the Hopf map
- `/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr`
  — non-orientable topology; S³ / 2I (Poincaré homology sphere) is the
  quotient relevant here

## Outside sources

1. Coxeter, H.S.M. *Regular Polytopes* (3rd ed., Dover, 1973). Public-domain
   mathematical content. The coordinate families and edge-count theorems are
   from Chapter 7 and Table I(ii).
2. Conway, J.H. & Smith, D.A. *On Quaternions and Octonions* (A.K. Peters,
   2003). The identification of 2I with the 600-cell vertices is proved in
   §4.3. Mathematical content is PD; cited for attribution.
