# Sprott C Attractor — Dual-Quadratic 6-Term ODE, Paired Shilnikov Saddle-Foci

**System** Sprott Case C (1994) — `ẋ = yz   ẏ = x − y   ż = c − xy`  
**Author** Julien Clinton Sprott — Phys Rev E 50(2):R647–R650, 1994  
**Licence** CC0 (original mathematics public domain)  
**Blender** 5.1 — bpy direct-data API, no operators  
**Category** Scripting / Dynamical Systems  

---

## Quick Start

```bash
# In Blender 5.1 → Scripting workspace:
# 1. Open blueprint.py in the text editor
# 2. Click ▶ Run Script  (~60–90 s for all four shape keys)
# 3. Open record.py → Run Script  (renders viewport.mp4)
```

---

## What This Is

Sprott C is one of nineteen minimal three-variable ODEs catalogued by
Julien Clinton Sprott in 1994, chosen by computer search for having at
most six terms and at most two quadratic nonlinearities and exhibiting
genuine bounded chaos.

The distinguishing feature of Case C is its **dual product nonlinearities**:

| Term | Role |
|---|---|
| `y·z` in ẋ | x is driven only when *both* y and z are nonzero |
| `x·y` in ż | z is damped from equilibrium only when *both* x and y are nonzero |

Neither nonlinearity is self-referential (no `x²`); both require two
distinct variables to activate. This mutual-gating property creates
slow passages near the `z = 0` plane — the locus of both fixed points —
that are qualitatively different from the relaxation slowing in
Sprott L or the laminar intervals in Rössler.

---

## Fixed Points (canonical c = 1.0)

```
P₊ = (+1, +1, 0)
P₋ = (−1, −1, 0)

Both are Shilnikov saddle-foci:
  λ_real  ≈ −1.352   (stable)
  λ_cmplx ≈ +0.176 ± 1.203i   (unstable spiral)

Shilnikov condition: |−1.352| > 0.176  ✓  →  guaranteed horseshoe chaos
```

The Z₂ symmetry `(x,y,z) → (−x,−y,z)` maps P₊ ↔ P₋ and maps the attractor
to itself, producing two mirror-image scrolling lobes.

---

## Dynamical Parameters

| Quantity | Value (canonical c = 1.0) |
|---|---|
| Divergence ∇·F | −1 (constant) |
| Lyapunov λ₁ | ≈ +0.101 |
| Lyapunov λ₂ | ≈ 0 |
| Lyapunov λ₃ | ≈ −1.101 |
| Kaplan-Yorke D_KY | ≈ 2.092 |
| Lyapunov time τ | ≈ 9.9 time-units |

---

## Shape Keys

| Key | c | Equilibria | Character |
|---|---|---|---|
| Basis | 1.0 | ±(1,1,0) | canonical chaos, twin lobes |
| SK_cLow | 0.7 | ±(0.837,0.837,0) | contracted orbits |
| SK_cHigh | 1.5 | ±(1.225,1.225,0) | expanded, looser winding |
| SK_cWide | 2.0 | ±(1.414,1.414,0) | near-bifurcation boundary |

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — integrates orbit, builds Bishop tube, assigns FLOAT_COLOR attribute, exports GLB |
| `record.py` | EEVEE Next render — camera orbit + shape-key animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

---

## Integration Parameters

- RK4 step `DT = 0.01` — ~10 steps per dominant oscillation cycle
- Burn-in: 3 000 steps (transient discarded)
- Record: 90 000 steps, thinned by 30 → **3 000 waypoints**
- Tube: 10-sided polygon, radius 0.025 m → **30 000 verts / 29 970 quads**

---

## Cross-References

- [Sprott A (conservative chaos, KAM tori)](../../python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr/)
- [Sprott B (two-quadratic minimal chaos)](../../python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr/)
- [Sprott E (saddle-centre, Hamiltonian-like)](../../python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr/)
- [Sprott L (x²-rectifying nonlinearity)](../../python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr/)
- [Rössler (single Shilnikov saddle-focus)](../../python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr/)
- [Shimizu-Morioka (Z₂ twin-scroll laser mode)](../../python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr/)
- [Shaw Attractor (Z₂ dual symmetric scrolls)](../../python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr/)

---

## Sources

1. **Sprott JC** (1994) "Some simple chaotic flows"
   *Phys Rev E* 50(2):R647–R650. DOI [10.1103/PhysRevE.50.R647](https://doi.org/10.1103/PhysRevE.50.R647).
   Public-domain mathematics. Companion atlas: <https://sprott.physics.wisc.edu/chaos/>

2. **Gilpin W** (2021–2024) *dysts* Dynamical Systems Benchmarks. MIT licence.
   <https://github.com/williamgilpin/dysts> — Lyapunov exponents and
   Kaplan-Yorke dimensions for 131 chaotic systems.
