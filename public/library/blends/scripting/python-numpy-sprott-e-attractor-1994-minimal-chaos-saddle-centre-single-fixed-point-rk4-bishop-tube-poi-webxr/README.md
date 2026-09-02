# Sprott E Attractor — Saddle-Centre Fixed Point, Minimal 5-Term Chaos

**Blender 5.1 · Python / numpy · Scripting · CC0**

| Property | Value |
|---|---|
| System | Sprott E (1994), α-parameterised |
| Equations | ẋ = y·z   ẏ = x²−y   ż = 1−α·x |
| Canonical (α=4) | ∇·F = −1 · λ₁≈+0.053 · D_KY≈2.050 |
| Fixed point | P = (1/α, 1/α², 0) — unique; eigenvalues −1, ±i/√α |
| Integration | RK4, dt=0.010, N=90 000 steps, thin=30 → 3 000 waypoints |
| Mesh | Octagonal Bishop parallel-transport tube, r=0.052 m |
| Colour | `SprottE_Speed` FLOAT_COLOR POINT (cobalt slow → amber fast) |
| Shape keys | Basis (α=4) · SK_Loose (α=3) · SK_Tight (α=5) · SK_Wide (α=2.5) |

## Why this attractor matters

Sprott E is part of a nineteen-member census published in 1994 in which
Julien Clinton Sprott searched exhaustively through all three-variable autonomous
polynomial ODEs with ≤ 6 terms and ≤ 2 quadratic nonlinearities, looking for
those that sustain genuine bounded chaos.  E is unusual even within this unusual
set: it has only **five** terms (not six) and **one** fixed point (not two or
three), and that fixed point has a rare eigenvalue structure.

## The saddle-centre eigenvalue

Setting ẋ = ẏ = ż = 0 gives the unique equilibrium P = (1/α, 1/α², 0).

The Jacobian at P evaluates to:

```
J(P) = [[  0,    0,   1/α² ],
        [ 2/α,  -1,    0   ],
        [ -α,    0,    0   ]]
```

Its characteristic polynomial factors as:

```
λ³ + λ² + (1/α)λ + 1/α = (λ + 1)(λ² + 1/α) = 0
```

So the three eigenvalues are: **−1** (real) and **±i/√α** (purely imaginary).

The purely imaginary pair means P is a *centre* in its own 2-D invariant plane —
no linear spiral. The real eigenvalue −1 provides a stable manifold transverse to
that plane. This combination ("saddle-centre") is more typical of Hamiltonian
systems than of dissipative attractors; here the global nonlinear terms are what
fold the centre manifold orbits into a strange attractor.

The parameter α directly controls the imaginary part 1/√α:
- **α=4** (canonical): imaginary part 1/2, moderate oscillation near P
- **α=3** (SK_Loose): imaginary part 1/√3 ≈ 0.577, slower spin → wider loops
- **α=5** (SK_Tight): imaginary part 1/√5 ≈ 0.447, faster spin → tighter ribbon
- **α=2.5** (SK_Wide): imaginary part 1/√2.5 ≈ 0.632, near-onset geometry

## Divergence and the Liouville identity

```
∇·F = ∂(yz)/∂x + ∂(x²−y)/∂y + ∂(1−αx)/∂z = 0 + (−1) + 0 = −1
```

Every dissipative term in the system flows through the single linear term −y in
the second equation.  Remove it and the system becomes non-dissipative. This
is minimal dissipation.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Main bpy script — mesh, shape keys, FLOAT_COLOR |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_sprott_e_poi.blend` | Saved scene (run blueprint.py to generate) |
| `hf_sprott_e_poi.glb` | WebXR-ready export (Draco 6, WebP, +Y up) |

## Related entries in this library

- [Sprott A — conservative chaos, no fixed points](/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr)
- [Sprott B — 6-term minimal chaos, constant divergence](/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr)
- [Rössler attractor — single-quadratic band chaos](/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr)
