# Lévy Flight & Brownian Motion
## Python numpy — Cauchy Step Distribution, Superdiffusion & 3D Poi Light-Trail NURBS for WebXR (Blender 5.1)

**Topic area:** Scripting / Probability & Stochastic Processes  
**Blender version:** 5.1  
**Licence:** CC0

### What this produces

Three side-by-side NURBS tube objects exported as `hf_levy_flight.glb`:

| Object | Walk type | Step distribution | Visual character |
|--------|-----------|-------------------|-----------------|
| `hf_brownian` | Brownian motion | Gaussian (α=2) | Compact teal blob |
| `hf_levy_1_5` | Lévy stable α=1.5 | Power-law sub-Cauchy | Violet, moderate jumps |
| `hf_cauchy` | Lévy flight / Cauchy | Cauchy (α=1) | Amber, extreme flights |

### How to run

```bash
blender --background --python blueprint.py
```

For the animated viewport render:

```bash
blender --background hf_levy_flight.blend --python record.py
```

### Key algorithmic ideas

- **Chambers-Mallows-Stuck (1976)**: generates α-stable step magnitudes from
  `V ~ Uniform(−π/2, π/2)` and `W ~ Exponential(1)` — no rejection sampling.
- **Marsaglia sphere sampling**: uniform 3-D directions without sin/cos bias.
- **NURBS CHUNK_SIZE**: 120-point clamped NURBS splines form the path tubes.
- **Superdiffusion**: Lévy MSD grows as τ^(2/α), diverging for α ≤ 1; contrast
  Brownian MSD ∝ τ.

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full generative script |
| `record.py` | Viewport animation render (192 frames, 8 s orbit) |
| `SCREEN-RECORDING-NOTES.md` | OBS screen-capture instructions |
| `.expected-artefacts.json` | CI artefact list |

### Outside sources

1. Lévy, Paul (1937) *Théorie de l'addition des variables aléatoires* — Gauthier-Villars, Paris. Public domain mathematical work. Introduces stable distributions.
2. Chambers, Mallows & Stuck (1976) "A Method for Simulating Stable Random Variables" *JASA* 71(354), pp. 340-344. Public domain algorithm. <https://doi.org/10.2307/2285309>
3. NumPy BSD-3-Clause — <https://numpy.org/doc/stable/reference/random/>
