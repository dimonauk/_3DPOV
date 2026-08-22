# GN Simulation Zone — Coupled Pendulums: Mathieu Parametric Resonance

**Blender version:** 5.1  
**Licence:** CC0  
**Topic:** Geometry Nodes · Simulation Zone · Physics Simulation  
**Difficulty:** Advanced  
**Studio tutorial:** `/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance`

---

## What this is

A chain of 20 pendulums, each free to swing in its own plane, connected to
its neighbours by torsional springs. The pivot row oscillates vertically at
the pendulums' natural frequency, driving **Mathieu parametric resonance**:
starting from a small perturbation, individual modes grow exponentially until
nonlinear `sin(θ)` saturation and inter-mode coupling redistribute energy.

The simulation runs entirely inside a **Blender 5.1 GN Simulation Zone**
using the **symplectic Euler (kick-drift)** integrator — the same integrator
family used in molecular dynamics and orbital mechanics for its near-exact
energy conservation on long runs.

Boundary conditions come for free: `GeometryNodeSampleIndex` returns 0
for out-of-range indices (when `clamp = False`), so the ends are
automatically pinned at θ = 0.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates scene, mesh, attributes, and GN tree |
| `record.py` | Configures EEVEE render → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

**Generated outputs** (after running scripts):
- `hf_pendulums.blend` — the .blend file with baked simulation
- `public/library/videos/.../viewport.mp4` — rendered animation
- `public/library/videos/.../screen.mp4` — screen recording (Dimona)

---

## Quick start

```bash
blender --background --python blueprint.py
# Then open hf_pendulums.blend, bake simulation, run record.py
```

---

## Physics summary

```
α_i = −Ω₀²·f(t)·sin(θ_i) + K·(θ_{i-1} + θ_{i+1} − 2θ_i) − γ·ω_i

f(t)  = 1 + 2ε·sin(2π·f_d·t)          Mathieu driving term
Ω₀²  = g/L = 39.24 rad²/s²
K     = 5.0 rad/s²  (coupling)
γ     = 0.012       (damping/step)
ε     = 0.15        (driving amplitude)
f_d   ≈ 0.996 Hz   (principal resonance: ω_d = Ω₀)
```

Integrator (symplectic Euler, dt = 1/24 s):
```
ω_{t+1} = ω_t + α_t · dt       ← kick with old position
θ_{t+1} = θ_t + ω_{t+1} · dt  ← drift with NEW velocity
```

---

## Outside sources

- **Blender Manual — Simulation Zone**  
  CC-BY-SA 4.0 · Blender Foundation  
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html

- **NIST DLMF Chapter 28 — Mathieu Functions**  
  Public Domain · US Government  
  https://dlmf.nist.gov/28

- **OpenStax University Physics Vol.1 Ch. 15 — Oscillations**  
  CC BY 4.0  
  https://openstax.org/books/university-physics-volume-1/pages/15-introduction
