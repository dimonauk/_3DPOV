# Sprott M Attractor — Blender 5.1 Library Entry

**Topic:** Chaotic ODE visualisation · **Category:** poi-head · **Engine:** Blender 5.1

## System

Sprott (1994) "Some simple chaotic flows", *Phys Rev E* 50(2):R647.

```
ẋ = −z
ẏ = −x² − y
ż = 1.7 + 1.7x + 0.6y
```

A 6-term 3-D ODE with a single quadratic nonlinearity (x²).  The x² term
appears in ẏ as a position-dependent damping that drives trajectories toward the
parabolic surface y = −x².  The linear forcing in ż pushes phase volume away from
the two fixed points.

## Properties

| Property | Value |
|----------|-------|
| Divergence ∇·F | **−1** (constant, parameter-independent) |
| Fixed points | P₁ ≈ (3.617, −13.08, 0)  P₂ ≈ (−0.783, −0.613, 0) |
| P₂ eigenvalues | λ_s ≈ −1.30,  λ_c ≈ +0.15 ± 1.42i |
| Shilnikov ratio at P₂ | \|λ_s\| / Re(λ_c) = **8.67** >> 1 ✓ |
| P₁ eigenvalues | λ_r ≈ +0.82,  λ_c ≈ −0.91 ± 1.55i |
| Max Lyapunov λ₁ | ≈ +0.065 |
| Kaplan–Yorke D_KY | ≈ 2.061 |
| Liouville check | λ₁ + λ₂ + λ₃ = −1 = ∇·F ✓ |

## Shilnikov mechanism

P₂ is a **saddle-focus** with:
- a 1-D stable manifold (real negative eigenvalue λ_s ≈ −1.30)
- a 2-D unstable manifold (spiral outward, Re(λ_c) = +0.15)

Shilnikov's theorem (1965) guarantees that *any* homoclinic orbit to P₂ implies
infinitely many unstable periodic orbits — a horseshoe cascade — when
|λ_s| > Re(λ_c).  Here the ratio 8.67 is well above the threshold, giving robust
chaos over a wide parameter range.

P₁ has the complementary structure: a 1-D unstable manifold (positive real
λ_r ≈ +0.82) and 2-D stable spiral.  Trajectories ejected along P₁'s unstable
manifold are captured by P₂'s unstable spiral and returned through phase space,
sustaining the strange attractor.

## Integration

- **Method**: RK4, fixed step DT = 0.01
- **Why DT = 0.01**: the stiffest eigenvalue is Im ≈ 1.42 rad/step at P₂;
  RK4 stability limit for purely imaginary h·λ is |h·λ| < 2√2 ≈ 2.83.
  h·Im(λ_c) = 0.01 · 1.42 = 0.014, far inside the limit.
- **Burn-in**: 2 000 steps (~20 Lyapunov times)
- **Record**: 90 000 steps, THIN=30 → **3 000 waypoints**
- **IC**: (0.1, 0.5, 0.0) — off the fixed-point parabola

## Shape keys

| Key | Parameters | Effect |
|-----|-----------|--------|
| Basis | A=1.7, B=1.7, C=0.6 | Canonical Sprott M |
| SK_WeakA | A=1.2, B=1.7, C=0.6 | Weaker constant offset → fixed points migrate, orbit contracts |
| SK_HighC | A=1.7, B=1.7, C=0.9 | Stronger y-feedback → orbit broadens in z |
| SK_LowB | A=1.7, B=1.2, C=0.6 | Weaker x-coupling in ż → topology shift near P₁ |

## Geometry

- Tube cross-section: TUBE_SIDES = 8, TUBE_R = 0.035 m
- Poi-head bounding sphere: POI_R = 0.085 m
- Vertex count: 3 000 × 8 = **24 000 verts**, 2 999 × 8 = **23 992 quad faces**
- Colour attribute: `SprottM_Speed` FLOAT_COLOR (cobalt=slow, amber=fast)
- Export: `hf_sprott_m_poi.blend` + `hf_sprott_m_poi.glb` (Draco 6, WebP)

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full production script — runs in Blender 5.1 Scripting workspace |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Outside sources

- Sprott JC (1994) *Some simple chaotic flows*, Phys Rev E 50(2):R647.
  Mathematics public domain.  [sprott.physics.wisc.edu](https://sprott.physics.wisc.edu/chaos/)
- Gilpin W (2021–2024) *dysts: Dynamical Systems Benchmarks* (MIT).
  [github.com/williamgilpin/dysts](https://github.com/williamgilpin/dysts)
- Bishop RL (1975) *There is more than one way to frame a curve*,
  Am Math Monthly 82(3):246–251.  Public domain.
