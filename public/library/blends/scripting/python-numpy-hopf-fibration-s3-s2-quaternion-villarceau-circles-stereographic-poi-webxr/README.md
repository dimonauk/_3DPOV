# Hopf Fibration  S³→S²

**Map**: `h(q) = q·i·q*` where q ∈ S³ is a unit quaternion  
**In coordinates**: `h(a,b,c,d) = (2(ac+bd), 2(bc−ad), a²+b²−c²−d²)`  
**Fibre**: Great circles in S³ → Villarceau circles in ℝ³ (via stereographic projection)  
**Studio slug**: `python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr`  
**Blender**: 5.1 · **Licence**: CC0 (blueprint code) · **Source equations**: PD (Hopf 1931)

---

## What this is

Heinz Hopf's 1931 paper described the first non-trivial principal fibre bundle: a continuous
surjective map h: S³→S² where every pre-image h⁻¹(p) is a circle (S¹).  This was
revolutionary because it showed that the 3-sphere cannot be "pulled apart" into a product
S²×S¹ — the fibres twist around each other.

The visual consequence is extraordinary.  After stereographic projection from S³ to ℝ³,
each fibre becomes a circle in ordinary space.  Any two fibres are either disjoint or
**Hopf-linked** (linking number exactly 1) — they pass through each other's holes without
touching.  All 16 fibres in this poi head are mutually linked.

The pre-image of a latitude circle on S² is a **Clifford torus** in S³, which stereographically
projects to a conventional torus in ℝ³.  Shape key SK_2Lat shows two such tori at pz=±0.5:
they are linked, and every circle on one torus passes through every circle on the other.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script — Hopf fibres + Bishop tube + 4 shape keys |
| `record.py` | Renders 8-second viewport animation to `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the hands-on screen.mp4 |
| `.expected-artefacts.json` | Manifest of expected output files |

---

## Quick start

1. Open Blender 5.1.
2. Scripting workspace → paste `blueprint.py` → **Run Script**.
3. Switch to 3D Viewport.  Object `hf_hopf_poi` is ready.
4. To render: paste `record.py` → Run Script.

---

## Parameters

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `N_BASE` | 16 | number of Hopf fibres |
| `N_PTS` | 64 | points per fibre circle |
| `TUBE_SEGS` | 8 | cross-section sides |
| `TUBE_R` | 0.045 m | tube radius |
| `Z_MARGIN` | 0.10 | pole exclusion band |

---

## Shape keys

| Key | Configuration | Visual |
|-----|--------------|--------|
| Basis | 16 fibres, Fibonacci spiral on S² | Distributed rings, full sphere |
| SK_CapN | All base points mirrored to pz>0 | Fibres expand toward equator |
| SK_Equat | All base points near equator | All rings on one torus (Villarceau circles) |
| SK_2Lat | 8+8 on two latitude rings (pz=±0.5) | Two linked tori |

---

## Outside sources

1. **Hopf, H. (1931).** "Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche."
   *Mathematische Annalen* 104:637–665. DOI [10.1007/BF01457962](https://doi.org/10.1007/BF01457962)
   — Equations are mathematical facts, public domain.

2. **Lyons, D.W. (2003).** "An Elementary Introduction to the Hopf Fibration."
   *Mathematics Magazine* 76(2):87–98. [faculty.lvc.edu/lyons/pubs/hopf.pdf](https://faculty.lvc.edu/lyons/pubs/hopf.pdf)
   — Clear coordinate proof that each fibre is a great circle. Openly accessible.

---

## Related studio tutorials

- [Torus Knot T(p,q)](/tutorials/blender-tutorial-python-numpy-torus-knot-pq-seifert-genus-milnor-fibre-bishop-tube-poi-webxr) — S¹ fibres over S¹, related to Seifert surfaces of Hopf-linked knots
- [Schwarzschild Geodesics](/tutorials/blender-tutorial-python-numpy-schwarzschild-geodesics-gr-effective-potential-isco-mercury-precession-poi-disc-webxr) — curves on a 2-sphere (S² geometry)
- [Fibonacci Sphere Scatter](/tutorials/blender-tutorial-python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr) — golden-angle distribution on S²
