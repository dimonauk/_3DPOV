# Double Pendulum — Lagrangian Chaos, RK4, Bishop Tube Poi Head

**Blender 5.1 · Python + NumPy · Holoflow Studio**

A double pendulum is two rigid rods, each with a point mass, coupled at a
hinge. At small angles it behaves like a pair of weakly coupled harmonic
oscillators — predictable and symmetric. Increase the initial angle past
roughly 90° and the system crosses into deterministic chaos: two trajectories
separated by a millimetre diverge so fast that after three seconds they share
no qualitative resemblance. The Lyapunov exponent λ₁ ≈ +7 s⁻¹ in the fully
chaotic regime is among the highest of any simple mechanical system.

This entry traces the lower-bob tip path, wraps it in a Bishop
parallel-transport tube, colours by instantaneous kinetic energy
(Cobalt → Amber), and exports a Draco-6 FLOAT_COLOR GLB for WebXR. Three
shape keys sample distinct dynamical regimes.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script — run in Scripting workspace |
| `record.py` | Automated viewport render (180 fr, 30 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Generated artefacts

- `hf_double_pendulum_poi.blend` — save after running blueprint.py
- `hf_double_pendulum_poi.glb` — Draco-6 WebXR GLB

## Physics

Lagrangian  L = T − V, generalised coordinates (θ₁, θ₂):

```
T = ½(m₁+m₂)L₁²ω₁² + ½m₂L₂²ω₂² + m₂L₁L₂ω₁ω₂cos(θ₁−θ₂)
V = −(m₁+m₂)gL₁cosθ₁ − m₂gL₂cosθ₂
```

Mass matrix (Δ = θ₁ − θ₂):

```
M = [[(m₁+m₂)L₁,  m₂L₂cos(Δ)],
     [L₁cos(Δ),    L₂         ]]
```

## Shape keys

| Key | IC (θ₁, θ₂, ω₁, ω₂) | Regime |
|-----|------------------------|--------|
| Basis | 40°, −10°, 0, 0 | Mixed / weakly chaotic |
| SK_Chaotic | 120°, −30°, 2.0, 0 | Strongly chaotic (butterfly fill) |
| SK_WideSwing | 170°, 10°, 0, 3.0 | Near-inverted, large amplitude |
| SK_Tight | same as Basis | Thin wires (TUBE_R × 0.5) |

## Sources

- Lagrange J-L (1788) *Mécanique Analytique* — Public Domain
  https://archive.org/details/mcaniqueanaly00lagr
- NumPy Developers — BSD-3-Clause — https://numpy.org

## Licence

CC0 — all generated mesh data is studio-authored.
