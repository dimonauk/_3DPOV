# Sprott L Attractor — 5-Term Quadratic ODE, Shilnikov Saddle-Focus

**Blender 5.1 · Python / NumPy · Bishop Tube · WebXR Poi Head**

## What this is

Sprott L is entry #12 in Julien Clinton Sprott's 1994 systematic search for
the simplest possible three-variable autonomous ODEs that sustain bounded
chaos.  Five terms, one quadratic nonlinearity, one fixed point:

```
ẋ = y + 3.9·z
ẏ = 0.9·x² − y
ż = 1 − x
```

The `x²` term in `ẏ` is a **rectifying nonlinearity**: it is always
non-negative, perpetually injecting energy into the system regardless of the
sign of `x`.  Linear dissipation `−y` removes that energy, and the slow
`ż = 1 − x` oscillation couples everything back through `ẋ`.

The fixed point `P* ≈ (1, 0.9, −0.231)` is a **Shilnikov saddle-focus**:
one stable real eigenvalue (≈ −1.47) and one unstable complex pair
(≈ +0.235 ± 1.61i).  Because |λ_stable| = 1.47 > Re(λ_unstable) = 0.235,
Shilnikov's 1965 theorem guarantees that the homoclinic orbit near P* is
genuinely chaotic (infinitely many periodic orbits of horseshoe type within
any neighbourhood of P*).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: integrates orbits, builds Bishop-tube mesh, colours by speed, exports `.glb` |
| `record.py` | EEVEE Next viewport animation (9 s, 270 frames, orbiting camera + shape-key sweep) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable spec: vertices, shape keys, physics constants |

## Quick start

```bash
blender --background --python blueprint.py
# → hf_sprott_l_poi.glb in same directory
```

## Shape keys

| Key | a | b | Character |
|-----|---|---|-----------|
| Basis | 3.9 | 0.9 | Canonical Sprott L, single scroll |
| SK_HighA | 5.0 | 0.9 | Stronger z-coupling → wider spiral |
| SK_LowB | 3.9 | 0.6 | Weaker rectification, near bifurcation |
| SK_Compact | 2.8 | 1.1 | Tighter orbit, high rectification |

## Key numbers

- Constant divergence  ∇·F = −1
- Lyapunov exponents   λ₁ ≈ +0.063, λ₂ = 0, λ₃ ≈ −1.063
- Kaplan-Yorke dim     D_KY ≈ 2.059
- Fixed point          P* = (1, 0.9, −3/13)
- Waypoints per key    3 000  (90 000 RK4 steps, thinned 30×)

## Licence

CC0 — mathematics in the public domain.  bpy code authored for this studio.

## Sources

- Sprott JC (1994) "Some simple chaotic flows" *Phys Rev E* 50(2):R647–R650.
  [DOI 10.1103/PhysRevE.50.R647](https://doi.org/10.1103/PhysRevE.50.R647)
- Sprott JC chaos atlas: <https://sprott.physics.wisc.edu/chaos/>
- Gilpin W (2021–2024) *dysts* Dynamical Systems Benchmarks (MIT):
  <https://github.com/williamgilpin/dysts>
