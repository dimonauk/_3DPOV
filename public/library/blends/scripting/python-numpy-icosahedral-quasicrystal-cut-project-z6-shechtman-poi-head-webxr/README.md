# Icosahedral Quasicrystal — 6D Cut-and-Project Method

**Category**: scripting · **Blender**: 5.1 · **Licence**: CC0

A poi head built from a true icosahedral quasicrystal lattice.  Vertex
positions are the physical-space projections of Z⁶ integer lattice points
whose perpendicular-space projections land inside a spherical acceptance
window.  The result carries icosahedral point symmetry (m3̄5̄) with no
repeating unit cell — the defining property Shechtman observed in
Al-Mn alloys in 1984.

## Mathematics

The 6D → 3D cut-and-project construction uses two orthogonal subspaces:

- **E∥** (physical space) — spanned by the 6 normalised icosahedral star
  vectors with golden-ratio component τ = (1+√5)/2.
- **E⊥** (internal / perpendicular space) — spanned by the same vectors
  with τ replaced by its Galois conjugate −1/τ = (1−√5)/2.

A lattice point **n** ∈ Z⁶ is accepted when |P⊥ **n**| < R_window.
Its physical position is x = P∥ **n**.

Two bond lengths appear in every accepted cluster: a short bond l₀ and
a long bond τ·l₀, exactly as in Penrose tilings (the 2-D analogue).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Pure-Python/bpy construction; run headless |
| `record.py` | Animated orbit renderer → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Run

```bash
blender --background --python blueprint.py
# produces hf_quasicrystal_poi.blend + hf_quasicrystal_poi.glb

blender hf_quasicrystal_poi.blend --python record.py
# produces viewport.mp4
```

## Cross-references

- [Penrose P3 Quasicrystal Stage Floor](/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr) — the 2-D analogue
- [Wigner-Seitz Cell: BCC/FCC Brillouin Zone 3-D Voronoi](/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr) — periodic lattice acceptance windows
- [24-Cell {3,4,3}: D₄ Root Lattice](/tutorials/blender-tutorial-python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr) — higher-dimensional lattice projection

## Outside sources

1. **Shechtman et al. (1984)** "Metallic Phase with Long-Range Orientational Order and No Translational Symmetry" *Physical Review Letters* 53(20):1951–1953. [doi:10.1103/PhysRevLett.53.1951](https://doi.org/10.1103/PhysRevLett.53.1951). Public Domain (mathematical content / 1984).
2. **Duneau & Katz (1985)** "Quasiperiodic Patterns" *Physical Review Letters* 54(25):2688–2691. [doi:10.1103/PhysRevLett.54.2688](https://doi.org/10.1103/PhysRevLett.54.2688). Public Domain (mathematical content / 1985).
