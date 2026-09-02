# Sprott B Attractor — Minimum-Complexity 3-D Chaos

**Blender 5.1 · Python / numpy · Scripting · CC0**

| Property | Value |
|---|---|
| System | Sprott B (1994), generalised with parameter c |
| Equations | ẋ = y·z   ẏ = x − y   ż = c − x·y |
| Canonical (c=1) | ∇·F = −1 (constant) · λ₁≈+0.041 · D_KY≈2.039 |
| Equilibrium | P = (0, 0, c) — saddle-focus |
| Integration | RK4, dt=0.015, N=90 000 steps, thin=30 → 3 000 waypoints |
| Mesh | Octagonal Bishop-tube, 8 segments, r=0.048 m |
| Colour | `Sprott_B_Speed` FLOAT_COLOR POINT (cobalt slow → amber fast) |
| Shape keys | Basis (c=1.0) · SK_cLow (c=0.7) · SK_cHigh (c=1.4) · SK_cWide (c=2.0) |

## Why this attractor matters

Julien Clinton Sprott's 1994 systematic search through polynomial 3-D ODEs
(Phys. Rev. E 50:R647) was the first rigorous census of minimal chaotic
systems.  He sifted through every system with ≤ 6 terms and ≤ 2 quadratic
nonlinearities and found exactly nineteen that are genuinely chaotic.
Sprott B is one of them.

The six terms of Sprott B are:

```
ẋ = y·z          ← coupling: x is driven by y times z
ẏ = x − y        ← the ONLY source of dissipation (the −y term)
ż = c − x·y      ← coupling back: z is driven by c minus x times y
```

Remove any one term and the system either becomes non-chaotic, non-bounded,
or non-autonomous.  This is the minimum.

## Constant divergence

```
∂ẋ/∂x = 0    ∂ẏ/∂y = −1    ∂ż/∂z = 0
∇·F = −1
```

All of the attractor's dissipation flows through a single linear term.
Liouville: λ₁ + λ₂ + λ₃ ≈ +0.041 + 0 − 1.041 = −1 = ∇·F ✓

## The c parameter family

Setting ż = c − x·y shifts the equilibrium to P=(0,0,c) and scales the
basin.  The attractor remains topologically the same single-lobe strange
attractor across c ∈ [0.5, 2.5]; outside this range it bifurcates.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Main bpy script — builds mesh, colours, shape keys |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_sprott_b_poi.blend` | Saved scene (run blueprint.py to generate) |
| `hf_sprott_b_poi.glb` | WebXR-ready export (Draco 6, WebP, +Y up) |

## Source

Sprott JC (1994) "Some simple chaotic flows," *Phys. Rev. E* **50**(2):R647–R650
DOI [10.1103/PhysRevE.50.R647](https://doi.org/10.1103/PhysRevE.50.R647)
Free pre-print: <https://sprott.physics.wisc.edu/pubs/paper229.pdf>
Companion C code (MIT licence): <https://sprott.physics.wisc.edu/chaos/>

Sprott JC (2010) *Elegant Chaos: Algebraically Simple Chaotic Flows*,
World Scientific. Companion MIT C code: <https://sprott.physics.wisc.edu/chaos/elegantchaos.htm>

## Tutorial

[/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr](/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr)
