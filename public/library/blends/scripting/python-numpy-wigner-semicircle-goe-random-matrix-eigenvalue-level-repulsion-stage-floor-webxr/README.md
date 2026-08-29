# Wigner Semicircle Law — GOE Random-Matrix Eigenvalue & Level-Spacing Statistics

**Blender 5.1 · Python + NumPy · Stage Floor · WebXR**

> *Eugene Wigner (1955) noticed that the neutron resonance levels of uranium-238 — a
> many-body quantum system far too complex to solve — obeyed the same spacing law as the
> eigenvalues of a completely random symmetric matrix. The miracle is that it works: the
> details of the Hamiltonian become irrelevant, and universal statistics take over.*

---

## Physics

### Gaussian Orthogonal Ensemble (GOE)

The GOE is the set of all real symmetric N×N matrices H whose entries are drawn from
Gaussians. The normalisation convention used here places the bulk spectrum in [−2, 2]:

```
A_{ij} ~ N(0, 1)  i.i.d.
H = (A + Aᵀ) / √(2N)

Off-diagonal entry variance: 1/N
Diagonal entry variance:     2/N
```

`np.linalg.eigh` exploits symmetry (O(N³/3)) and returns real-valued eigenvalues sorted
in ascending order.

### Wigner Semicircle Law

As N → ∞, the empirical eigenvalue density converges weakly to:

```
ρ_sc(λ) = (1/2π) √(4 − λ²),    |λ| ≤ 2
         = 0,                    otherwise
```

This is the free-probability analogue of the Central Limit Theorem. Under free
convolution — the correct addition law for large random matrices — the semicircle is the
unique attractor, just as the Gaussian is the attractor under ordinary convolution
(Voiculescu 1985).

### Level Repulsion — Wigner Surmise

After **unfolding** — rescaling each spacing by the local mean spacing
`1 / (N · ρ_sc(midₙ))` so that the global mean spacing equals 1 everywhere in the
bulk — the nearest-neighbour spacing distribution follows:

```
P_GOE(s) ≈ (π/2) s · exp(−π s² / 4)        Wigner surmise
P_Pois(s) = exp(−s)                          Poisson (integrable)

P_GOE(0) = 0   — eigenvalues repel (level repulsion)
P_Pois(0) = 1  — levels may cluster freely
```

The linear factor `s` in P_GOE forces P(0) = 0: no two GOE eigenvalues ever coincide.
Classically-integrable quantum systems show Poisson statistics (Berry–Tabor conjecture,
1977).

### BGS Conjecture

Bohigas, Giannoni, and Schmit (1984) conjectured — and extensive numerical evidence
supports — that quantum-chaotic Hamiltonians follow GOE level statistics, while
integrable systems follow Poisson. The standard map (K > K_c) and Bunimovich stadium
billiard are canonical examples.

### Montgomery–Odlyzko Connection

Hugh Montgomery (1973) conjectured that the pair-correlation function of Riemann zeta
zeros on the critical line matches the GUE (Gaussian Unitary Ensemble) pair-correlation —
the complex analogue of the GOE. Andrew Odlyzko's numerical computations (1987, 10¹³
zeros) confirmed this to extraordinary precision. This connects quantum chaos, random
matrices, and the distribution of prime numbers.

---

## What the floor encodes

The 120 × 120 height-field uses two physical axes:

```
x-axis (world X, metres):  eigenvalue λ ∈ [−2.3, 2.3]
y-axis (world Y, metres):  unfolded spacing s ∈ [0, 3.5]
z-axis (height):           h = log(ε + count) / max_log_count,  ε = 1

height ≈ 1  →  many (λ, s) pairs fell here  →  Wigner surmise ridge at s ≈ 0.9
height ≈ 0  →  very few pairs  →  the s = 0 void (level repulsion) and the bulk edges
```

Only bulk eigenvalues |λ| < 1.90 are included; the Tracy–Widom edge near |λ| ≈ 2 follows
different statistics and would distort the histogram.

### Shape keys

| Key | N | Symmetry class | What you see |
|---|---|---|---|
| **Basis** | 100 | GOE | Sharp Wigner ridge at s ≈ 0.9; deep void at s = 0 |
| SK_Small | 20 | GOE | Same ridge, but noisy — finite-N fluctuations large |
| SK_Med | 50 | GOE | Intermediate convergence; ridge clearly forming |
| SK_Pois | 100 | Poisson (uniform random) | Exponential peak at s = 0; no repulsion |

### Vertex colour

`WignerCol` FLOAT_COLOR POINT:
- **Cobalt** `(0, 0.38, 0.74)` — low density (s = 0 void, bulk edges)
- **Amber** `(1.0, 0.65, 0)` — high density (Wigner peak, semicircle arc)

---

## Quick start

```python
# In Blender 5.1 → Scripting workspace:
# 1. Open blueprint.py and click Run Script
# 2. Wait for console output: "[wigner] 14400 verts  14161 quads  4 shape keys  Done."
# 3. Switch to Layout workspace; the WignerGOE_Floor object is in the scene.
# 4. To record the animation: open record.py, click Run Script.
```

### Export to GLB for WebXR

```
File → Export → glTF 2.0 (.glb/.gltf)
  ☑ Apply Modifiers
  ☑ +Y Up
  ☑ Draco Compression  (level 6)
  ☑ Export Morph Targets
  ☑ Export Vertex Colors
  Compression:  Draco level 6
  Textures:     WebP
Output file: wigner_goe_floor.glb
```

---

## File listing

| File | Purpose |
|---|---|
| `blueprint.py` | Procedural generator — run in Blender 5.1 Scripting workspace |
| `record.py` | Viewport animation recorder — 240 frames, 24 fps, EEVEE Next |
| `README.md` | This file |
| `SCREEN-RECORDING-NOTES.md` | OBS settings and suggested takes |
| `.expected-artefacts.json` | CI / library manifest validation |

---

## Licence

All code and generated geometry: **CC0** (public domain dedication).

---

## External references

- Wigner EP (1955) "Characteristic Vectors of Bordered Matrices with Infinite Dimensions."
  *Ann. of Math.* 62(3): 548–564. [Public domain — publication predates 1978]
- Bohigas O, Giannoni MJ, Schmit C (1984) "Characterization of Chaotic Quantum Spectra
  and Universality of Level Fluctuation Laws." *Phys. Rev. Lett.* 52: 1–4.
  doi:[10.1103/PhysRevLett.52.1](https://doi.org/10.1103/PhysRevLett.52.1)
- NumPy Developers. *NumPy* (BSD-3-Clause). <https://numpy.org>
