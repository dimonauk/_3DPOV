# Sprott D Attractor — Five-Term Two-Quadratic Non-Hyperbolic Origin

**Blender 5.1 · Python scripting · RK4 · Bishop parallel-transport tube**

## What this is

Sprott D is one of nineteen minimal strange attractors from Julien Clinton
Sprott's 1994 systematic search (Phys Rev E 50:R647).  Its equations are:

```
ẋ = −y
ẏ =  x + z
ż =  xz + b·y²      canonical b = 3
```

Five terms, two quadratic nonlinearities: a product term `xz` and a squared
term `b·y²`.  The canon value b = 3 produces the strange attractor charted
in the original paper.

### Why it is special

Every other Sprott attractor in this studio library has at least one
*hyperbolic* equilibrium — a saddle or a Shilnikov saddle-focus — from
which the standard geometric theory of chaos (horseshoe maps, homoclinic
tangles) proceeds directly.  Sprott D breaks this pattern:

| Fixed point | Eigenvalues | Type |
|-------------|-------------|------|
| O = (0, 0, 0) | 0, +i, −i | **Non-hyperbolic centre** |

The zero eigenvalue means that linear analysis at the origin is inconclusive.
Chaos is instead driven by the global interaction of the product nonlinearity
`xz` (which couples position and altitude) and the restoring `y²` quadratic.

### Lyapunov spectrum (b = 3, from Gilpin dysts MIT)

| Exponent | Value | Meaning |
|----------|-------|---------|
| λ₁ | ≈ +0.182 | positive → chaotic |
| λ₂ | ≈  0     | tangent to flow |
| λ₃ | ≈ −0.272 | dissipation |
| D_KY | ≈ 2.669 | Kaplan-Yorke fractal dimension |

D_KY ≈ 2.669 is the highest in the current Sprott sub-library — the
attractor is unusually space-filling.

### Divergence

∇·F = x (position-dependent).  Phase volume contracts where x < 0,
expands where x > 0.  The time-averaged ⟨x⟩ ≈ −0.09 on the attractor
sustains a slight net contraction.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the `.blend` scene (run in Scripting workspace) |
| `record.py` | Renders `viewport.mp4` (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Outputs

- `hf_sprott_d_poi.blend` — Blender source
- `hf_sprott_d_poi.glb` — WebXR-ready (Draco 6, WebP, +Y up)
- `public/library/videos/scripting/.../viewport.mp4`
- `public/library/videos/scripting/.../screen.mp4`

## Shape keys

| Key | b | Character |
|-----|---|-----------|
| Basis | 3.0 | Canonical Sprott D — most chaotic, D_KY≈2.669 |
| SK_LoB | 1.5 | Weaker y² coupling — orbit contracts inward |
| SK_HiB | 5.0 | Stronger y² coupling — wider, more space-filling |
| SK_ExB | 8.0 | Extreme y² — large orbit, long chaotic transients |

## Licence

Blueprint code: CC0 (public domain).  
Mathematical system: public-domain (Sprott 1994 Phys Rev E).

## External references

- Sprott JC (1994) "Some simple chaotic flows" Phys Rev E 50(2):R647–R650
  https://doi.org/10.1103/PhysRevE.50.R647
- Sprott chaos atlas: https://sprott.physics.wisc.edu/chaos/
- Gilpin W (2021–2024) dysts MIT: https://github.com/williamgilpin/dysts
