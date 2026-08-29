# Rabinovich–Fabrikant Attractor — Modulation-Instability Chaos Poi Head

**Blender 5.1 · Python + NumPy · WebXR poi light trail**

A scrolling strange attractor derived from the nonlinear physics of wave
self-modulation in plasma.  Mikhail Rabinovich and Anatoly Fabrikant published
the governing equations in 1979 to describe how a wave packet slowly modulating
its own amplitude in a dispersive, weakly-lossy medium can become stochastic.
The system is compact (three ODEs, one nonlinear term per equation) yet produces
orbit topology that is genuinely different from the Lorenz butterfly — a
single-sheet scroll with a characteristic fold rather than two symmetric lobes.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Pure-bpy/NumPy script — run in Blender Scripting workspace |
| `record.py` | Viewport animation render — run after blueprint |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `hf_rf_poi.blend` | Blender file (produced by blueprint.py) |
| `hf_rf_poi.glb` | Draco-6 GLB (produced by blueprint.py) |

## The ODE

```
ẋ = y(z − 1 + x²) + γ x
ẏ = x(3z + 1 − x²) + γ y
ż = −2z(α + xy)
```

`x`, `y` — real and imaginary parts of the complex wave amplitude.  
`z` — local energy density surplus above the instability threshold.  
`γ` — net dissipation/gain balance; `α` — mode coupling strength.

At γ=0.87, α=1.1 the system is chaotic (Lyapunov λ₁ ≈ +0.16,
Kaplan-Yorke D_KY ≈ 2.05).  At γ=0.10, α=0.14 the attractor collapses
to a period-2 limit cycle; at γ=0.10, α=0.10 mild chaos returns.

## Mesh

- **Waypoints**: 3 000 (60 000 RK4 steps × dt=0.003, keep 1 in 20; 5 000 burn-in)
- **Tube**: 8-sided Bishop parallel-transport, radius 0.013 m
- **Vertices**: 24 000 · **Faces**: 23 976 quads
- **Shape keys**: Basis (γ=0.87/α=1.1) · SK_PeriodTwo (γ=0.10/α=0.14) · SK_WeakChaos (γ=0.10/α=0.10)
- **FLOAT_COLOR POINT** `RF_Speed`: velocity magnitude cobalt (slow) → amber (fast)

## Licence

Blueprint: CC0.  
Original paper: M. I. Rabinovich & A. L. Fabrikant (1979), mathematical content Public Domain.

## Related tutorials

- [Lorenz attractor — RK4 butterfly](../../../../components/tutorials/entries/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr.tsx)
- [Halvorsen attractor — Z₃ symmetry](../../../../components/tutorials/entries/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr.tsx)
- [Thomas cyclically symmetric attractor](../../../../components/tutorials/entries/blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr.tsx)
- [Rössler attractor — RK4](../../../../components/tutorials/entries/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting.tsx)
