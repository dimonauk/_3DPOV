# Sprott F Attractor — Blender 5.1 Library Entry

**System:** Sprott 1994 Case F · three-variable ODE · single quadratic term  
**Topology:** two-equilibrium strange attractor · constant negative divergence  
**Mesh:** Bishop-tube poi head · 3 000 waypoints · 4 shape keys  
**Attribute:** `SprottF_Speed` FLOAT_COLOR · cobalt (slow) → amber (fast)

## Equations

```
ẋ = y + z             (sum coupling)
ẏ = −x + a·y          (rotation with half-damper)
ż = x² − z            (quadratic input; linear decay)
```

Canonical parameter: **a = 0.5**

## Why this is interesting

Sprott F achieves chaos with a single `x²` term — half the nonlinearity budget
of a Lorenz system.  The origin is a Shilnikov saddle-focus (|λ_r|=1.0 >
Re(λ_c)=0.25), which guarantees horseshoe chaos near any homoclinic orbit.
The constant divergence `∇·F = a−1 = −0.5` means phase-space volume contracts
at a uniform rate regardless of where you are — unlike variable-divergence
systems such as the Dadras or Aizawa attractors, where contraction depends on
position.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene: RK4 integration, Bishop tube, shape keys, material |
| `record.py` | Viewport animation render (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Cross-references and mesh metadata |

## Shape keys

| Key | a | Effect |
|-----|---|--------|
| Basis | 0.50 | Canonical 1994 chaos — writhing two-wing orbit |
| SK_LoA | 0.25 | Weaker half-damper; broader, slower windings |
| SK_HiA | 0.75 | Stronger damping; tighter spiral toward origin |
| SK_NearCons | 0.92 | Near-conservative; ∇·F→−0.08, loosening orbit |

## Running the blueprint

1. Open Blender 5.1.
2. Scripting workspace → open `blueprint.py`.
3. `Alt+P` (Run Script).  The attractor appears in the 3D viewport.
4. For the video: open `record.py` → `Alt+P`.  Output → `videos/…/viewport.mp4`.

## Sources

- Sprott JC (1994) "Some simple chaotic flows", *Phys Rev E* 50(2):R647–R650
  — public-domain mathematics.  
  Web atlas: <https://sprott.physics.wisc.edu/chaos/>
- Gilpin W (2021–2024) *dysts* dynamical-systems benchmarks (MIT)  
  <https://github.com/williamgilpin/dysts>  
  Lyapunov spectra and Kaplan-Yorke dimensions for all 131 systems.
