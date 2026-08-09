# Hénon-Heiles Hamiltonian — Störmer-Verlet Symplectic Integration, KAM Tori & Poincaré Section Poi Head

**Category**: scripting · **Blender**: 5.1 · **Licence**: CC0

A complete blueprint for generating a poi light-trail head from the Hénon-Heiles
Hamiltonian system (1964).  The orbit is integrated with the Störmer-Verlet
symplectic leapfrog — which preserves the phase-space 2-form exactly — and mapped
into (x, px, y) extended 3D phase space.  Three shape keys show the KAM
breakdown: quasi-periodic tori (E=0.083), mixed regular-chaotic (E=0.125), and
widespread Hamiltonian chaos (E=0.165).  A companion vertex cloud renders the
Poincaré section (y=0, ṗy>0 crossings) as a glowing point field.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: integrate, build tube mesh, shape keys, Poincaré cloud, export GLB |
| `record.py` | Automated viewport animation render to `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_henon_heiles.blend` | Generated blend file (run blueprint.py to create) |
| `hf_henon_heiles.glb` | Draco-6 GLB for WebXR (run blueprint.py to create) |

## Quick start

```bash
# Run in Blender 5.1 Scripting workspace
blender --python blueprint.py
# or open Scripting tab, load blueprint.py, press Run Script
```

## Mathematics

The Hénon-Heiles Hamiltonian:

```
H = ½(px² + py²) + ½(x² + y²) + x²y − y³/3

Equations of motion:
  ẋ  =  px
  ẏ  =  py
  ṗx = −x − 2xy
  ṗy = −y − x² + y²

Escape threshold: H = 1/6 ≈ 0.1667  (three equivalent saddle points)
```

The cubic perturbation terms `x²y − y³/3` have C₃ symmetry (three-fold) and
create three equivalent escape saddles at `H = 1/6`, hence the name "triangle
hill".  Below the saddle energy most orbits are quasi-periodic (KAM tori);
above it, near-critical orbits can escape to infinity.

## Störmer-Verlet vs RK4

| Property | Störmer-Verlet | RK4 |
|---|---|---|
| Order | 2nd | 4th |
| Symplectic | ✓ exact | ✗ |
| Energy drift | oscillates, bounded | grows (polynomial) |
| Evaluations per step | 1 | 4 |
| Long-time fidelity | excellent | degrades |

For Hamiltonian systems, Störmer-Verlet over 100 000 steps out-performs RK4
over KAM structure precisely because symplecticity is what the KAM theorem
requires.  Use RK4 for dissipative systems (Lorenz); use leapfrog for
conservative ones.

## Expected artefacts

- `hf_henon_heiles.blend` — Blender scene with tube mesh, shape keys, Poincaré clouds
- `hf_henon_heiles.glb` — WebXR-ready GLB (~340 KB Draco-compressed)
- `viewport.mp4` — 12 s 1080p orbit + shape-key demo (created by record.py)
- `screen.mp4` — full screen recording (created manually with OBS)

## Studio cross-references

- [Duffing Oscillator Poincaré Sections](/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr) — forced nonlinear oscillator; same Poincaré section technique but for a dissipative system with a period-doubling route to chaos.
- [Lorenz Strange Attractor RK4](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr) — dissipative ODE chaos; compare with Hénon-Heiles conservative chaos (phase volume contracts vs. conserved).
- [Hopf Fibration S³→S²](/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr) — phase-space topology; Hopf fibration appears in the structure of 2D integrable Hamiltonian tori.
- [ABC Flow Beltrami RK4 Streamlines](/tutorials/blender-tutorial-python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr) — 3D Hamiltonian-like structure-preserving vector field.

## Outside sources

- Hénon, M. & Heiles, C. (1964). *The applicability of the third integral of motion: some numerical experiments.* The Astronomical Journal 69:73. ADS open access. Mathematical content Public Domain. https://ui.adsabs.harvard.edu/abs/1964AJ.....69...73H
- NumPy contributors. *NumPy Reference Documentation.* BSD-3-Clause. https://numpy.org/doc/stable/

---
*Holoflow Studio · Blender Expert Content Mill*
