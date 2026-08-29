# Lorenz-96 Atmospheric Ring — N-Variable Chaotic Attractor Poi Head (WebXR)

**Blender 5.1** · Python scripting · bpy direct-data API · CC0

---

## What this is

The Lorenz-96 system (Lorenz & Emanuel 1998) is a minimal N-dimensional ODE
designed to mimic the statistical behaviour of atmospheric turbulence on a
latitude circle:

```
dXᵢ/dt = (Xᵢ₊₁ − Xᵢ₋₂)·Xᵢ₋₁  −  Xᵢ  +  F      i = 0 … N−1 (mod N)
```

- **Advection** `(Xᵢ₊₁ − Xᵢ₋₂)·Xᵢ₋₁` — energy transported westward round ring
- **Damping** `−Xᵢ` — internal dissipation
- **Forcing** `+F` — solar heating / large-scale forcing

With N = 8 and F = 8 the system has **two positive Lyapunov exponents** and is
the standard benchmark for **Ensemble Kalman Filters** (EnKF) in numerical
weather prediction.  The (X₀, X₁, X₂) 3-D projection yields a compact strange
attractor rendered here as a Bishop parallel-transport tube poi head.

---

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy script — integrate L96, build tube, shape keys, vertex colour |
| `record.py` | Renders 300-frame animation cycling through all shape keys |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar shot list for the tutorial video |
| `.expected-artefacts.json` | Manifest for CI artefact checking |

---

## Shape keys

| Key | F | Description |
|-----|---|-------------|
| Basis | 8.0 | Canonical chaos — two positive Lyapunov exponents |
| SK_Hopf | 5.0 | Near-Hopf limit cycle — loose, loopy orbit |
| SK_Onset | 5.76 | Exact bifurcation threshold — boundary of chaos |
| SK_Strong | 16.0 | Strong turbulence — fast, densely tangled tube |

---

## Technique notes

- **RK4 integration**: dt = 0.005, 4 000 warmup + 50 000 production steps
  subsampled every 16 → **≈ 3 125 tube waypoints**
- **Bishop parallel-transport frame**: avoids Frenet torsion singularities at
  inflection points; propagated by Rodrigues rotation between adjacent tangents
- **Vertex colour** `Lorenz96_V`: cobalt (slow) → amber (fast), encodes the
  non-uniform time sampling characteristic of strange attractors
- **holoflow export**: `+Y` up, Draco-6, WebP, root name `lorenz96_poi`

---

## Outside sources

- Lorenz, E. N. & Emanuel, K. A. (1998). *Optimal Sites for Supplementary
  Weather Observations*. J. Atmos. Sci. **55**, 399-414.
  DOI: 10.1175/1520-0469(1998)055<0399:OSFSWO>2.0.CO;2  (PD / fair use)
- Evensen, G. (2009). *Data Assimilation: The Ensemble Kalman Filter*,
  2nd ed. Springer.  Chapter 4 uses L96 as the primary test bed.

---

## Studio cross-references

- [Double Pendulum](/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr) — same Bishop tube method, simpler 4-D system
- [Chirikov Standard Map](/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr) — complementary view: discrete Hamiltonian chaos, KAM breakdown
- [Bloch Sphere](/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr) — another N-state ring geometry, quantum spin dynamics
