# Ising Model — Metropolis Monte Carlo

**Topic:** Statistical mechanics / phase transitions  
**Blender version:** 5.1  
**Technique:** Python scripting — numpy vectorised Metropolis-Hastings  
**Output:** `hf_ising_floor.blend` + `hf_ising_floor.glb`

## What this produces

A 64×64 height-field mesh where each vertex corresponds to one spin site on a
2D square lattice. Vertex Z encodes spin value (±8 cm). Three temperature
regimes are captured as shape keys:

| Shape key | Temperature | Physical state |
|-----------|-------------|----------------|
| Basis | 4.0 (> Tc) | Disordered / paramagnetic |
| T_crit | ≈ 2.27 (Tc) | Critical fluctuations — self-similar clusters |
| T_low | 1.0 (< Tc) | Ferromagnetic — large ordered domains |

Vertex colours (FLOAT_COLOR, linear) are from the critical state: blue = spin-up,
magenta = spin-down. The Emission material makes the colour visible without
Cycles lighting.

## Algorithm

Checkerboard (bipartite sublattice) Metropolis sweep:
1. Divide lattice into black/white sites (chessboard pattern).
2. All black sites update simultaneously — they share no nearest neighbours,
   so updates are statistically independent (Creutz 1980).
3. Repeat for white sites.
4. One full sweep = 2 half-sweeps × N²/2 updates = N² updates total.

For site i: ΔE = 2Jσᵢ(Σ₄ neighbours). Accept if ΔE ≤ 0 or with probability
exp(−ΔE/kT).

## Running

Open Blender 5.1 → Scripting workspace → paste `blueprint.py` → Alt+P.

Expected console output:
```
[ising] Tc (Onsager 1944) = 2.269185
[ising] T_high = 4.000  (paramagnetic) …
[ising] T_crit = 2.2692 (critical)      …
[ising] T_low  = 1.000  (ferromagnetic) …
[ising] mean magnetisation: {'high': 0.003, 'crit': -0.12, 'low': 0.94}
[ising] building mesh …
[ising] exporting GLB …
[ising] ✓ exported //hf_ising_floor.glb
```

Runtime: approximately 20–60 seconds depending on CPU.

## Sources

- Onsager L (1944) *Phys Rev* **65** 117–149 — exact Tc derivation (PD mathematical)
- Metropolis N, Rosenbluth A, Rosenbluth M, Teller A, Teller E (1953)
  *J Chem Phys* **21** 1087 — algorithm (PD mathematical)
- NumPy (BSD-3-Clause) — https://numpy.org
