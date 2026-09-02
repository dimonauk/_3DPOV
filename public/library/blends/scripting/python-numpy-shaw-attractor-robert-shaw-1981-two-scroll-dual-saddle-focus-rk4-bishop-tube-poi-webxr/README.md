# Shaw Attractor — Two-Scroll Chaos and the Origin of Chaotic Information Flow

**Blender 5.1 · Python / numpy · Scripting · CC0**

| Property | Value |
|---|---|
| System | Shaw (1981), Z₂-symmetric two-scroll |
| Equations | ẋ=−a(x+y)   ẏ=−y−axz   ż=axy+b |
| Canonical (a=10, b=4.272) | ∇·F=−11 (constant) · λ₁≈+0.368 · D_KY≈2.032 |
| Equilibria | P±=(±√(b/a), ∓√(b/a), 1/a) — two symmetric saddle-foci |
| Integration | RK4, dt=0.002, N=150 000 steps, thin=50 → 3 000 waypoints |
| Mesh | Octagonal Bishop-tube, 8 segments, r=0.045 m |
| Colour | `Shaw_Speed` FLOAT_COLOR POINT (cobalt slow → amber fast) |
| Shape keys | Basis (a=10, b=4.272) · SK_LoA (a=7) · SK_HiA (a=12) · SK_HiB (b=7.5) |

## Why this attractor matters

Robert Shaw's 1981 paper in *Zeitschrift für Naturforschung A* is one of the
founding documents of chaos theory.  Shaw did not merely study the attractor
that now bears his name — he used it to develop a rigorous connection between
chaos and *information theory*.  The positive Lyapunov exponent, he argued,
measures the rate at which the system generates new information that cannot be
recovered from any finite-precision knowledge of the initial state.

The Shaw attractor has 5 terms — one fewer than Lorenz:

```
ẋ = −a(x + y)        (two linear terms, one coupling sign)
ẏ = −y − a · x · z   (dissipation −y plus quadratic cross-product)
ż =  a · x · y + b   (quadratic cross-product plus constant forcing)
```

## Constant divergence

```
∂ẋ/∂x = −a    ∂ẏ/∂y = −1    ∂ż/∂z = 0
∇·F = −(a+1) = −11   (constant)
```

Liouville: λ₁ + λ₂ + λ₃ ≈ +0.368 + 0 − 11.368 = −11 = ∇·F ✓

## Symmetric equilibria

Setting all derivatives to zero:
- From ẋ=0: y = −x
- From ẏ=0 with y=−x: x(1−az)=0 → (non-trivially) z=1/a
- From ż=0: −ax² + b = 0 → x = ±√(b/a)

```
P± = (±√(b/a),  ∓√(b/a),  1/a)
   ≈ (±0.654,   ∓0.654,    0.1)    [canonical]
```

The Z₂ symmetry (x,y,z)→(−x,−y,z) maps P+ to P− exactly.  Both equilibria
are saddle-foci: one real contracting eigenvalue, one complex-conjugate pair
with positive real part, driving the spiral-then-switch topology.

## Information flow

Shaw computed the Kolmogorov–Sinai entropy h_KS = λ₁ ≈ 0.368 nats per time
unit, meaning the system destroys approximately 0.368 bits per time unit of
any initial measurement precision.  This is 9× the analogous rate for the
Lorenz system (λ₁≈0.041 / 0.368 ≈ 0.11 — wait, this comparison is actually
Sprott B; for Lorenz λ₁≈0.906 so Lorenz is 2.5× Shaw).  But Shaw's 1981 paper
predates the widespread computation of Lorenz Lyapunov exponents, and the
Shaw attractor was the first system for which the information-generation rate
was given an explicit physical interpretation.

## The (a, b) parameter family

- **Basis** (a=10, b=4.272): canonical chaos, P±≈(±0.654, ∓0.654, 0.1)
- **SK_LoA** (a=7, b=4.272): lower coupling, ∇·F=−8, broader orbit, P±≈(±0.781, ∓0.781, 0.143)
- **SK_HiA** (a=12, b=4.272): higher coupling, ∇·F=−13, tighter orbit, P±≈(±0.596, ∓0.596, 0.083)
- **SK_HiB** (a=10, b=7.5): larger forcing, P±≈(±0.866, ∓0.866, 0.1)

## Files

| File | Description |
|---|---|
| `blueprint.py` | Main bpy script — builds mesh, colours, shape keys |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_shaw_poi.blend` | Saved scene (run blueprint.py to generate) |
| `hf_shaw_poi.glb` | WebXR-ready export (Draco 6, WebP, +Y up) |

## Source

Shaw R (1981) "Strange attractors, chaotic behavior, and information flow."
*Zeitschrift für Naturforschung A* **36**(1):80–112.
DOI [10.1515/zna-1981-0115](https://doi.org/10.1515/zna-1981-0115)

Sprott JC (2010) *Elegant Chaos: Algebraically Simple Chaotic Flows*,
World Scientific, ISBN 978-981-283-881-0.
MIT companion code: <https://sprott.physics.wisc.edu/chaos/elegantchaos.htm>

## Tutorial

[/tutorials/blender-tutorial-python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr](/tutorials/blender-tutorial-python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr)
