# Chen Attractor — Library Entry

**Slug**: `python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr`  
**Blender version**: 5.1  
**Licence**: CC0 (equations are mathematical content, public domain)  
**Category**: poi-head · scripting  
**Export**: `chen_attractor_poi.glb`

---

## What this is

The Chen attractor (Guanrong Chen & Ueta 1999) is an autonomous three-variable ODE
whose strange attractor looks like Lorenz's double-lobe butterfly but is built from
an "anti-dual" mechanism. Lorenz contracts in the y-direction (∂ẏ/∂y = −1 constant);
Chen expands directly through a `+cy` feedback term (∂ẏ/∂y = c = +28). Both share
constant phase-space divergence — −10 for Chen, −13.67 for Lorenz — which means
Liouville's theorem gives an exact sanity check: the sum of Lyapunov exponents must
equal the divergence, to within numerical precision.

The Chen → Lü → Lorenz relationship (Lü & Chen 2002) forms a "unified chaotic
system" that can morph continuously from one butterfly to the other by varying a
single interpolation parameter.

## Quick start

```python
# In Blender 5.1 Scripting workspace:
exec(open("blueprint.py").read())
```

Console output: `[chen-attractor] blueprint complete — 36,000 vertices`  
GLB output: `chen_attractor_poi.glb` in the same directory.

## Parameters

| Constant | Value | Notes |
|---|---|---|
| A_CHEN | 35 | Contraction coefficient |
| B_CHEN | 3 | z-decay rate |
| C_BASIS | 28 | Canonical chaos; divergence = −10 |
| DT | 0.002 | RK4 step; λ₁≈2.03 → Lyapunov time ≈ 0.49 → 245 steps/τ |
| N_STEPS | 60 000 | Recorded integration steps |
| SKIP | 20 | → 3 000 waypoints |
| TUBE_SIDES | 12 | Cross-section polygon count |
| TUBE_R | 0.014 m | Tube radius |
| POI_R | 0.082 m | Poi head sphere radius |

## Shape keys

| Key | a | b | c | Notes |
|---|---|---|---|---|
| Basis | 35 | 3 | 28 | Canonical chaos, λ₁≈+2.03, D_KY≈2.17 |
| SK_Periodic | 35 | 3 | 23 | Near Hopf bifurcation (c≈22); stable limit cycle |
| SK_Wing | 35 | 3 | 31 | Denser chaotic wings; D_KY shifts toward 2.22 |
| SK_Lu | 36 | 3 | 20 | Lü bridge: interpolates Lorenz↔Chen |

## Lyapunov spectrum (canonical params)

```
λ₁ ≈ +2.027   positive → chaotic divergence time ≈ 0.49 model-steps
λ₂ ≈  0.000   near-zero → along-flow direction
λ₃ ≈ −12.027  folding onto the attractor sheet
∑λᵢ = −10.0   EXACT identity = −a + c − b = −35 + 28 − 3 = −10
D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.169
```

## Vertex colour

`Chen_Speed` FLOAT_COLOR POINT: instantaneous speed |ẋ,ẏ,ż|.  
- Cobalt (0.06, 0.14, 0.66) → slow, near saddle-focus neighbourhoods  
- Amber (0.88, 0.52, 0.04) → fast, through open manifold channels

## Expected artefacts

See `.expected-artefacts.json`.

## Cross-references

### Internal
- [Lorenz Attractor](../python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr/)
- [Thomas Cyclically-Symmetric Attractor](../python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr/)
- [Aizawa Attractor](../python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr/)
- [Chua Circuit Double-Scroll](../python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr/)

### External
- Chen G & Ueta T (1999) *Yet Another Chaotic Attractor*. Int J Bifurc Chaos 9(7):1465-1466. DOI:10.1142/S0218127499001024
- Lü J & Chen G (2002) *A New Chaotic Attractor Coined*. Int J Bifurc Chaos 12(3):659-661. DOI:10.1142/S0218127402004620
- Gilpin W (2021–2024) [dysts](https://github.com/williamgilpin/dysts) — MIT
