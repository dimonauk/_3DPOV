# Arneodo–Coullet–Tresser Attractor — Cubic Jerk, Z₂ Double-Scroll, Dual Shilnikov Saddle-Foci

**Blender 5.1 · Python / numpy · Scripting · CC0**

| Property | Value |
|---|---|
| System | ACT (Arneodo, Coullet & Tresser 1981), Z₂-symmetric cubic jerk |
| Equations | ẋ=y  ẏ=z  ż=−αz−βy+γx−x³ |
| Canonical (α=0.2, β=−1.4, γ=7.5) | ∇·F=−0.20 (constant) · λ₁≈+0.085 · D_KY≈2.01 |
| Fixed points | P₀=(0,0,0) · P±=(±√γ,0,0)≈(±2.739,0,0) |
| Shilnikov at P± | λ_s≈−2.72 · λ_u≈1.26±1.98i · ρ=|λ_s|/Re(λ_u)≈2.16 |
| Integration | RK4, dt=0.012, N=90 000 steps, thin=30 → 3 000 waypoints |
| Mesh | Octagonal Bishop-tube, r=0.048 m |
| Colour | `ACT_Speed` FLOAT_COLOR POINT (cobalt slow → amber fast) |
| Shape keys | Basis (γ=7.5) · SK_LowG (γ=5.5) · SK_HighG (γ=9.5) · SK_LowAlp (α=0.08) |

## Why this attractor matters

Arneodo, Coullet and Tresser's 1981 *Communications in Mathematical Physics*
paper — "Possible new strange attractors with spiral structure" — appeared
just five years after the term "strange attractor" was coined.  Its central
contribution was rigorous: the authors showed that Shilnikov's 1965 theorem
(which guarantees chaos from a homoclinic orbit to a saddle-focus) could be
applied to a *jerk* equation, the simplest possible 3D ODE with a third-order
scalar structure.

The ACT system is the polynomial analogue of the Duffing oscillator:

```
ẍ + α·ẍ + β·ẋ − γ·x + x³ = 0       (jerk / scalar form)

Equivalent:  ẋ = y     ẏ = z     ż = −α·z − β·y + γ·x − x³
```

Adding a jerk dissipation term α·ẍ to the Duffing equation is the minimal
change that replaces unbounded motion with a bounded strange attractor, while
retaining the Z₂ symmetry that forces two symmetric equilibria to exist.

## The cubic nonlinearity and Z₂ symmetry

Replacing x³ with x² (as in Genesio–Tesi 1992) breaks the symmetry: an even
power distinguishes positive from negative x, leaving only one non-trivial
fixed point.  The odd power x³ is invariant under x→−x, so the transformation
(x,y,z)→(−x,−y,−z) maps the system to itself exactly.  This forces P+ and P−
to appear as a conjugate pair:

```
P± = (±√γ, 0, 0) = (±2.739, 0, 0)   [canonical γ=7.5]
```

Both saddle-foci are equivalent by symmetry: the attractor is a true
double-scroll, not a near-symmetric approximation.

## Constant divergence

```
∂ẋ/∂x = 0    ∂ẏ/∂y = 0    ∂ż/∂z = −α
∇·F = −α = −0.20   (constant, γ-independent)

Liouville: λ₁ + λ₂ + λ₃ ≈ +0.085 + 0.000 − 0.285 = −0.200 = ∇·F  ✓
```

Unlike Sprott D or the Finance attractor — where divergence depends on the
phase-space position — ACT has uniform contraction everywhere.  Changing α
re-scales the contraction rate globally without altering the equilibrium
positions.

## Shilnikov analysis at P±

Jacobian at (√γ, 0, 0):

```
J = [[ 0,   1,  0]
     [ 0,   0,  1]
     [−2γ, −β, −α]]   →   [[ 0,  1,  0], [0, 0, 1], [−15, 1.4, −0.2]]
```

Characteristic polynomial at P±:  λ³ + αλ² + βλ + 2γ = 0
→  λ³ + 0.2λ² − 1.4λ + 15 = 0

Roots:
```
λ_s ≈ −2.720          (real, contracting — the 1D stable manifold)
λ_u ≈  1.260 ± 1.980i (complex, expanding — the 2D unstable spiral)

Shilnikov ratio: ρ = |λ_s| / Re(λ_u) = 2.720 / 1.260 ≈ 2.16 > 1  ✓
```

The Shilnikov theorem guarantees that the neighbourhood of each homoclinic
orbit contains a countably infinite number of periodic orbits of all periods
and an uncountable number of non-periodic orbits.  At ρ ≈ 2.16 the chaos is
moderate but well-established.

## The (α, β, γ) parameter family

- **Basis** (α=0.2, β=−1.4, γ=7.5): canonical chaos, P±≈(±2.74, 0, 0), ρ≈2.16
- **SK_LowG** (γ=5.5): P±=(±2.35, 0, 0), ρ decreases, scrolls contract inward
- **SK_HighG** (γ=9.5): P±=(±3.08, 0, 0), wider double-well, orbit expands; x³ still bounds
- **SK_LowAlp** (α=0.08): ∇·F=−0.08 (four times weaker), orbit balloons outward

## Files

| File | Description |
|---|---|
| `blueprint.py` | Main bpy script — builds mesh, colours, shape keys |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_act_poi.blend` | Saved scene (run blueprint.py to generate) |
| `hf_act_poi.glb` | WebXR-ready export (Draco 6, WebP, +Y up) |

## Sources

Arneodo A, Coullet P, Tresser C (1981).
"Possible new strange attractors with spiral structure."
*Communications in Mathematical Physics* **79**(4):573–579.
DOI [10.1007/BF01209312](https://doi.org/10.1007/BF01209312)

Gilpin W (2021). "Chaos as an interpretable benchmark for machine learning."
Supplementary data. MIT licence.
<https://github.com/williamgilpin/dysts>

## Tutorial

[/tutorials/blender-tutorial-python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr](/tutorials/blender-tutorial-python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr)
