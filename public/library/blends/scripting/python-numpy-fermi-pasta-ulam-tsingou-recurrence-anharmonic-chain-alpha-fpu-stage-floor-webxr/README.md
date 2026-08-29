# Fermi–Pasta–Ulam–Tsingou Recurrence — α-FPU Anharmonic Chain

**Fermi, Pasta, Ulam & Tsingou, 1955** · Blender 5.1 · CC0 · Topic: Scripting / Nonlinear Dynamics

## What is this?

In 1955, Enrico Fermi, John Pasta, Stanislaw Ulam, and Mary Tsingou ran the
first numerical simulation in physics on the MANIAC computer at Los Alamos.
They integrated a chain of N = 32 particles connected by springs with a
small cubic nonlinearity (the α-FPU model), expecting the energy initially
placed in the lowest Fourier mode to spread evenly across all modes —
thermalisation.

Instead, the energy came back. After apparently dispersing, it returned to
nearly the original single-mode excitation at the **FPUT recurrence time**
T_rec ≈ 800 time units. This contradicted every contemporary expectation
about ergodicity in nonlinear systems and launched the modern study of
nonlinear waves, soliton theory, and computational physics.

This blueprint integrates the α-FPU Hamiltonian via the Störmer–Verlet
symplectic method, samples the full displacement field x_i(t) into a
32 × 512 height-field stage floor, and colours it by |x_i|
(Cobalt = nodal / quiescent, Amber = peak displacement). The FPUT recurrence
appears as diagonal stripes of amber reconvening after apparent disorder.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds `fput_floor.blend` + `fput_floor.glb` |
| `record.py` | Viewport-animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Running

1. Open Blender 5.1 → Scripting workspace.
2. Load and run `blueprint.py`.  
   Builds `fput_floor.blend` + `fput_floor.glb` (~3–8 s on a modern CPU).
3. (Optional) `blender fput_floor.blend --background --python record.py`
   renders the 10-second `viewport.mp4`.

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `N_PART` | 32 | Chain length (Fermi's original) |
| `ALPHA_0` | 0.25 | Cubic anharmonicity — raises → faster recurrence |
| `DT` | 0.10 | Leapfrog timestep (natural frequency units) |
| `N_STEPS` | 8 192 | Total integration steps (= 819 time units) |
| `SAMPLE` | 16 | Store every Nth step → 512 frames on the floor |
| `A0` | 1.0 | Initial mode amplitude |
| `H_SCALE` | 0.30 m | Peak displacement height in the Blender scene |

## Shape keys

| Key | α value | Description |
|-----|---------|-------------|
| Basis | 0.250 | Classic FPUT — recurrence stripes visible at T ≈ 800 |
| SK_Linear | 0.000 | Linear chain — mode 1 frozen, no mixing |
| SK_Half | 0.125 | Weaker coupling — T_rec ≈ 1 600, slower spreading |
| SK_Double | 0.500 | Stronger coupling — rapid multi-mode mixing |

## Physics notes

The Hamiltonian is:

```
H = Σᵢ pᵢ²/2  +  (Δxᵢ)²/2  +  (α/3)(Δxᵢ)³
Δxᵢ = xᵢ − x_{i−1},   boundary: x₀ = x_{N+1} = 0
```

Normal-mode energies are tracked via the sine-transform:
```
qₖ = √(2/(N+1)) Σᵢ xᵢ sin(kπ(i+1)/(N+1))
Eₖ = (q̇ₖ² + ωₖ²qₖ²)/2,   ωₖ = 2 sin(kπ/(2(N+1)))
```

Kruskal & Zabusky (1965) showed the continuum limit of the α-FPU lattice
is the Korteweg–de Vries (KdV) equation; soliton collisions preserve phase
coherence and produce the recurrence.  The Toda lattice (an integrable
generalisation) admits exact soliton solutions that make this precise.

## Cross-references

- `/tutorials/blender-tutorial-python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr`
- `/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr`
- `/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr`
- `/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr`

## Outside sources

1. **Fermi, Pasta, Ulam & Tsingou (1955)** — "Studies of Nonlinear Problems,"
   LA-1940. Public Domain. https://www.osti.gov/biblio/4376203  
   Related: Zabusky & Kruskal (1965) "Interaction of 'Solitons'", Phys Rev Lett 15:240.

2. **NumPy Developers** — NumPy v2.x. BSD-3-Clause. https://numpy.org  
   Related: SciPy (BSD-3), matplotlib (PSF-compatible).
