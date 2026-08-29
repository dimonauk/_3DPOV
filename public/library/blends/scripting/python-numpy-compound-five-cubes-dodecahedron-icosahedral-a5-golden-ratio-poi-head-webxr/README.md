# Compound of Five Cubes in a Dodecahedron

**Topic:** Compound polyhedra · Icosahedral symmetry · A₅ group theory · Golden ratio  
**Blender version:** 5.1  
**Licence:** CC0 — mathematical content is public domain  
**Format:** blend · GLB (Draco-6, WebP, +Y up)

---

## What this is

A regular dodecahedron has 20 vertices that fall into two algebraic families
derived from the golden ratio φ = (1+√5)/2:

```
A-type : (±1, ±1, ±1)                         — 8 vertices (a cube!)
B-type : cyclic perms of (0, ±1/φ, ±φ)        — 12 vertices
```

Both families lie on a sphere of radius √3 (verified: 0² + 1/φ² + φ² = (2−φ)+(φ+1) = 3).

Exactly **five regular cubes** of edge-length 2 fit inside this dodecahedron,
each using 8 of the 20 vertices. Together they form the **compound of five cubes**,
a canonical object in polyhedral geometry with full icosahedral symmetry I_h.

## Why five?

The rotational icosahedral group I ≅ A₅ (alternating group on 5 elements, order 60)
acts on the 20 vertices and maps each cube to another. The stabiliser of any single
cube is the chiral tetrahedral group T ≅ A₄ (order 12), which fixes the cube
but permutes its four body diagonals. By the Orbit-Stabiliser theorem:

```
orbit size = |I| / |T| = 60 / 12 = 5   ✓
```

So there are exactly 5 cubes, and the action of I on {C₀…C₄} gives the famous
isomorphism I ≅ A₅ concretely as a permutation representation.

## Shape keys

| Key | Effect |
|---|---|
| Basis | Full five-cube compound |
| SK_Dodecahedron | Each cube vertex snaps to its dodecahedron source — shows the embedding |
| SK_Frame | Vertices retract to 92 % of the cube face centre — hollow wire look |
| SK_GoldenStar | Vertices pushed to φ/2 scale (clamped to poi sphere) — star silhouette |

## Vertex attribute

`Compound_Cube` (FLOAT_COLOR, POINT domain) — maps each of the 40 mesh vertices to
one of five colours (cobalt / amber / crimson / jade / ivory) identifying its cube.

## Files

```
blueprint.py              ← Blender 5.1 script; run in Text Editor
record.py                 ← renders viewport.mp4 (300 frames, EEVEE)
SCREEN-RECORDING-NOTES.md ← OBS capture guide
.expected-artefacts.json  ← pipeline manifest
hf_five_cubes_compound.blend   (generated)
../../glbs/.../hf_five_cubes_compound.glb   (generated)
```

## Outside sources

1. **Coxeter, H. S. M.** (1973). *Regular Polytopes*, 3rd ed. Dover. Public domain
   mathematical content. ISBN 0-486-61480-8.  
   URL: <https://store.doverpublications.com/0486614808.html>

2. **Wenninger, Magnus J.** (1971). *Polyhedron Models*. Cambridge University Press.
   Mathematical content public domain; physical book in copyright.  
   URL: <https://www.cambridge.org/gb/academic/subjects/mathematics/geometry-and-topology/polyhedron-models>

## Cross-references

- [Holoflow Codex — Icosahedral Symmetry](/codex/icosahedral-symmetry)  
- [Tutorial: Hopf Fibration](/tutorials/blender-tutorial-python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr)  
- [Tutorial: Kepler-Poinsot Star Polyhedra](/tutorials/blender-tutorial-python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr)  
- [Tutorial: 24-Cell Icositetrachoron](/tutorials/blender-tutorial-python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr)  
- [Tutorial: Goldberg Polyhedra GP(1,1) C60](/tutorials/blender-tutorial-python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr)
