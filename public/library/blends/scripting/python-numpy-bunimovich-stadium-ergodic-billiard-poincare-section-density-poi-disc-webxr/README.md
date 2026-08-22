# Bunimovich Stadium Ergodic Billiard — Poi Disc for WebXR

**Topic:** Dynamical systems · ergodic theory · billiards · Poincaré sections  
**Blender version:** 5.1  
**Licence:** CC0  
**Date:** 2026-08-22

## What this is

A Python bpy script that builds a **poi disc** whose surface height encodes the
**Poincaré section density** of the Bunimovich stadium billiard — one of the first
rigorously proved examples of a fully ergodic, mixing 2D dynamical system.

The disc has two height states, toggled by the shape key **SK_Circle**:

| Value | Geometry | Dynamics |
|---|---|---|
| 0 | Nearly flat | Stadium billiard — CHAOTIC / ergodic |
| 1 | Five concentric spike-rings | Circular billiard — INTEGRABLE |

## Mathematical gist

A billiard particle bounces specularly off the boundary.  At each bounce, record
**Birkhoff coordinates** (s, p):
- s = arc-length along boundary, normalised to [0, 1)
- p = sin θ where θ = reflection angle from the tangent

The invariant measure is **ds dp** (flat — that is why p = sin θ, not θ itself).

- **Stadium (L > 0):** Bunimovich (1979) proved ergodicity.  The Poincaré section
  fills [0,1]² uniformly → disc is nearly flat (chaos = no preferred region).
- **Circle (L = 0):** SO(2) symmetry conserves p at every bounce.  Each orbit lives
  on a horizontal band {p = const} → height field shows concentric rings at
  p₀ = sin(π/n) for inscribed n-gons (n = 3, 4, 5, 7, 9).

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main script — run in Blender 5.1 Scripting workspace |
| `record.py` | Viewport animation render (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Build manifest |

## Running

```bash
# In Blender 5.1 Python console or Scripting workspace:
exec(open("blueprint.py").read())

# To render the viewport animation:
exec(open("record.py").read())
```

## Expected output

- `hf_bunimovich_poi` mesh object in the scene
- Shape keys: `Basis` (stadium), `SK_Circle` (integrable rings)
- Vertex colour attribute `dc` (cobalt → amber density map)
- Material `hf_bunimovich_poi_mat` with colour attribute wired to BSDF

## Cross-references

**Studio tutorials (internal):**
- [Hénon-Heiles Hamiltonian](../python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr/)
  — KAM tori, Poincaré sections, mixed phase space
- [Lorenz Attractor](../python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr/)
  — Lyapunov exponents, strange attractors, chaos
- [Duffing Oscillator](../python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr/)
  — period doubling, Poincaré sections
- [ABC Flow Beltrami](../python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr/)
  — chaotic streamlines, Hamiltonian-like structure

**External sources:**
- Bunimovich, L. A. (1979). "On the ergodic properties of nowhere dispersing
  billiards." *Commun. Math. Phys.* **65**, 295–312.
  DOI: [10.1007/BF01197884](https://doi.org/10.1007/BF01197884)
  *(academic citation; mathematical content PD by nature)*
- Birkhoff, G. D. (1927). *Dynamical Systems*. AMS Colloquium Publications.
  *(Public Domain by age — foundational source for Birkhoff coordinates)*
- Cvitanović et al., *ChaosBook.org* — Chapter "Billiards."
  Available at <https://chaosbook.org> under the ChaosBook Creative Commons licence.
  Related projects: [ChaosBook companion software](https://github.com/cvitanov/reducesymm) (MIT)
