# Rayleigh–Taylor Instability — 2D Boussinesq Pseudo-Spectral Stage Floor

**Blender 5.1 / Python + NumPy / Stage floor / WebXR**

A 2-D simulation of the Rayleigh–Taylor instability (RTI) — the gravitational
overturning that occurs when a denser fluid rests atop a lighter one — baked
into a 64×64 vertex height-field stage floor with four shape keys showing the
classic progression from linear waves to fully developed mushroom-cap fingers.

---

## Physics

The Atwood number `A = (ρ₂−ρ₁)/(ρ₂+ρ₁)` measures the density contrast between
the heavy upper fluid and the light lower fluid.  It appears directly in the
linear growth rate `σ(k) = √(Agk)` and controls the curvature of the developing
fingers.

The simulation solves the 2-D incompressible **Boussinesq** equations in
vorticity–streamfunction form:

```
Dω/Dt = g·A·∂b/∂x     # baroclinic vorticity generation
Db/Dt = 0              # buoyancy b ∈ [−1,+1] advected passively
∇²ψ   = −ω            # Poisson eq (exact solve in spectral space)
u = ∂ψ/∂y,  v = −∂ψ/∂x
```

Integration: classical RK4, Δt = 0.025, 2/3-rule dealiasing (Orszag 1971).

---

## Shape keys

| Key | Sim time | Atwood | What you see |
|-----|----------|--------|--------------|
| Basis | t = 2.0 | A = 0.50 | Linear regime: sinusoidal interface waves |
| SK\_Fingers | t = 4.5 | A = 0.50 | Finger competition, some modes dominate |
| SK\_Mushroom | t = 7.0 | A = 0.50 | Fully developed mushroom-cap spikes |
| SK\_HighA | t = 4.5 | A = 0.85 | High-contrast rapid growth |

---

## Vertex attribute

`RTI_Omega` (FLOAT_COLOR, POINT domain):
cobalt `(0.06, 0.14, 0.66)` for CCW vorticity (ω < 0) →
amber `(0.88, 0.52, 0.04)` for CW vorticity (ω > 0).
Vorticity is sampled at the SK\_Mushroom stage (t = 7.0, A = 0.50).

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script — builds mesh, runs FFT simulation |
| `record.py` | Viewport animation render (10 s, 240 frames, 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `rti_floor.blend` | Saved after running blueprint.py |
| `rti_floor.glb` | Draco-6, WebP textures, morph targets, +Y-up |

---

## Sources

- Lord Rayleigh 1882 "Investigation of the character of the equilibrium of an
  incompressible heavy fluid of variable density" *Proc London Math Soc* 14:170.
  **Public Domain.**
- G. I. Taylor 1950 "The instability of liquid surfaces when accelerated in a
  direction perpendicular to their planes" *Proc R Soc Lond A* 201:192–196.
  **Public Domain — equations only.**
- NumPy Developers — BSD-3-Clause — https://numpy.org
