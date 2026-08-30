# Zaslavsky Stochastic Web — Kicked Oscillator, q-Fold Quasi-Crystal Corridors

**Blender 5.1** · Python + numpy · Stage Floor · WebXR-ready GLB  
Licence: CC0 | `public/library/blends/scripting/<slug>/`

---

## What this is

A 2-D harmonic oscillator kicked by periodic δ-pulses in a transverse magnetic
field generates a **stochastic web** in its phase plane.  When the kick period T
satisfies the resonance condition **ωT = 2π/q** (q ∈ ℤ), the web acquires
exact **q-fold rotational symmetry**:

| Shape key | q | Symmetry | Tiling type |
|-----------|---|----------|-------------|
| Basis | 4 | 4-fold | Square lattice corridors |
| SK_Q3 | 3 | 3-fold | Triangular / Y-junction |
| SK_Q6 | 6 | 6-fold | Hexagonal (honeycomb) |
| SK_Q5 | 5 | 5-fold | **Quasi-crystal** — non-periodic |

The q=5 case is special: five-fold rotational symmetry is **incompatible** with
any 2-D Bravais lattice (only 2, 3, 4, 6-fold symmetries tile the plane
periodically).  The stochastic web with q=5 is therefore genuinely
quasi-periodic — the same class of mathematical object as a Penrose tiling,
but arising here from the *dynamics* of a chaotic map rather than from a
geometric substitution rule.

---

## The map

```
x' =  x·cos α + (y + K·sin x)·sin α
y' = −x·sin α + (y + K·sin x)·cos α

α = 2π/q          cyclotron phase per kick (sets symmetry order)
K = 0.6           kick strength (controls web thickness vs. island size)
```

The map is **area-preserving** (Jacobian determinant = 1 everywhere) — it is a
symplectic map of the plane.  Between web strands lie regular KAM islands where
motion is quasi-periodic.  Inside the web, trajectories diffuse **anomalously**:

```
⟨r²(t)⟩ ∝ t^μ,   μ ≈ 1.3–1.7   (Lévy/superdiffusion)
```

This anomalous exponent μ arises from long trapping events in island stickiness
regions — the Zaslavsky fractional-kinetics effect.

---

## Blueprint parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `N_GRID` | 180 | Grid bins per axis (180² = 32 400 vertices) |
| `N_IC` | 100 | Independent trajectories per shape key |
| `N_ITER` | 18 000 | Map steps per trajectory |
| `XY_RANGE` | 4.5π | Phase-plane domain ±4.5π (≈2 web-cell widths) |
| `K_KICK` | 0.6 | Kick amplitude — raise to 1.0 for thicker webs |
| `HEIGHT_SCALE` | 0.5 m | z-elevation of densest strands |

---

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Load `blueprint.py` → **Run Script**.
3. Inspect the mesh: `Layout` → select `Zaslavsky_Web`.
4. Shape-keys panel: blend between `Basis`, `SK_Q3`, `SK_Q6`, `SK_Q5`.
5. For screen recording see `SCREEN-RECORDING-NOTES.md`.
6. For the rendered viewport animation run `record.py` in a second Text
   Editor tab after the scene is built.
7. Export for WebXR:
   ```
   File → Export → glTF 2.0
   Format: glb  |  +Y up  |  Apply transforms  |  Draco 6  |  WebP textures
   Shape Keys: ✓  |  Custom Properties: ✓
   ```

---

## Sources

- Zaslavsky G.M., Zakharov M.Yu., Sagdeev R.Z., Usikov D.A., Chernikov A.A.
  (1986) "Stochastic web and diffusion of particles in a magnetic field."
  *Zh. Eksp. Teor. Fiz.* **91**:500; English: *Sov. Phys. JETP* **64**(2):294.
  Equations public domain.

- Chernikov A.A., Sagdeev R.Z., Usikov D.A., Zakharov M.Yu., Zaslavsky G.M.
  (1987) "Minimal chaos and stochastic webs."
  *Nature* **326**:559–563. DOI: 10.1038/326559a0.
  Equations public domain.

- Zaslavsky G.M. (2002) "Chaos, fractional kinetics, and anomalous transport."
  *Physics Reports* **371**:461–580. Equations public domain.

---

## Related studio tutorials

- [Chirikov Standard Map — KAM Breakdown](/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr)
- [Ammann-Beenker Quasi-Crystal Stage Floor](/tutorials/blender-tutorial-python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr)
- [Sinai Billiard — Dispersing Billiard / Lorentz Gas](/tutorials/blender-tutorial-python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr)
