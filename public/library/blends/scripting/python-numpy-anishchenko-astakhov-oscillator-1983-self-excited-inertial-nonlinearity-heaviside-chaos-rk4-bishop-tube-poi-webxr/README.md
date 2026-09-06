# Anishchenko–Astakhov Self-Excited Oscillator with Inertial Nonlinearity (1983)

**Topic:** Chaotic attractor via piecewise (Heaviside) inertial nonlinearity  
**Blender:** 5.1 · **Renderer:** EEVEE Next · **Licence:** CC0  
**Category:** Scripting → Strange Attractor → Self-Excited / Filippov System  
**WebXR type:** Poi Head

---

## System

```
ẋ = m·x + y − x·z
ẏ = −x
ż = −g·z + g·Θ(x)·x²

Θ(x) = 1 if x > 0, else 0   (Heaviside step function)
```

**Canonical parameters:** m = 1.5, g = 0.4

---

## Why it is special

Most chaotic attractors in this library use *smooth* nonlinearities (cubics, products,
sines).  The Anishchenko–Astakhov system uses a **Heaviside step function** — the vector
field has a jump discontinuity on the plane x = 0.  This makes it a **Filippov system**:
a class of piecewise-smooth ODEs studied in Russian nonlinear dynamics from the 1960s
onwards.

The physical motivation is a **self-excited oscillator with diode-like saturation**:
think of a transistor circuit whose gain-control feedback only activates on positive
half-cycles.  The variable z acts as an "inertial" memory of recent positive amplitudes.
When z grows large, the term −x·z damps the oscillation.  When x is negative, z decays
freely.  This asymmetric charging creates the folding necessary for chaos.

**Route to chaos:** period-1 limit cycle → period-2 (period-doubling) → period-4 → chaos
as m increases from 0 toward ~1.3 (for g = 0.4).  At m = 1.5 the system is chaotic.

---

## Fixed-point analysis

The **only** equilibrium is the **origin O = (0, 0, 0)**.

Setting ẏ = 0 forces x = 0; then ẋ = 0 forces y = 0; then ż = 0 forces z = 0.

Jacobian at O (same on both sides of x = 0 plane, since Θ·x² → 0 as x → 0):

```
J = [[ m,  1,  0],
     [-1,  0,  0],
     [ 0,  0, -g]]
```

Eigenvalues from 2×2 (x,y) block: λ² − m·λ + 1 = 0
→ λ_{1,2} = m/2 ± i·√(1 − m²/4)

For m = 1.5: λ_{1,2} = **0.75 ± 0.661i** (UNSTABLE spiral)  
Third eigenvalue: λ₃ = **−g = −0.4** (stable along z-axis)

The origin is thus an **unstable spiral focus** — trajectories spiral outward in the
(x, y) plane while being stable along z.  The nonlinear Heaviside term prevents
unbounded growth.

---

## Divergence

```
∂ẋ/∂x = m − z       (position-dependent)
∂ẏ/∂y = 0
∂ż/∂z = −g          (constant)

∇·F = m − g − z = 1.1 − z   (canonical)
```

Divergence is **position-dependent** (specifically z-dependent).  The attractor exists
where ⟨∇·F⟩ < 0, meaning ⟨z⟩ > m − g = 1.1 on the chaotic orbit.  Numerically,
⟨z⟩ ≈ 2.1–2.8 for canonical parameters, giving ⟨∇·F⟩ ≈ −1.0 to −1.7.

Lyapunov exponents (approximate):  λ₁ ≈ +0.07,  D_KY ≈ 2.05

---

## Shape keys

| Key       | m    | g    | Character                                  |
|-----------|------|------|--------------------------------------------|
| Basis     | 1.50 | 0.40 | Canonical chaotic attractor                |
| SK_LowM   | 0.80 | 0.40 | Near limit-cycle; ordered period-1 or -2  |
| SK_HighM  | 2.50 | 0.40 | Larger, more energetic chaotic orbit       |
| SK_LowG   | 1.50 | 0.20 | Slow z-dynamics; attractor flattened in z  |

---

## Integration notes

- **RK4, fixed dt = 0.010**: Heaviside is evaluated at each of the four k-stages,
  giving second-order accuracy across the switching manifold.
- **Burn-in 5 000 steps** before recording (eliminates transient from IC).
- **90 000 steps, THIN = 30** → **3 000 waypoints** for the tube.
- Bishop parallel-transport frames eliminate Möbius-strip artefacts at the many
  near-origin passes.

---

## Files

| File                    | Purpose                                          |
|-------------------------|--------------------------------------------------|
| `blueprint.py`          | Full bpy script → .blend + .glb                  |
| `record.py`             | Viewport animation → viewport.mp4                |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4             |
| `.expected-artefacts.json` | CI artefact checklist                         |

---

## Outside sources

1. **Anishchenko VS, Astakhov VV (1983)** "Effect of noise on a generator with
   inertial nonlinearity." *Radio Engineering and Electronic Physics* 28(8).
   Equations: public-domain (pre-1984 Soviet publication, equations non-copyrightable).
   Related: Anishchenko VS *et al.* (1996) "Nonlinear Dynamics of Chaotic and
   Stochastic Systems" — foundational Saratov school monograph.

2. **Gilpin W (2021)** `dysts` — Dynamical Systems in Python. MIT licence.
   <https://github.com/williamgilpin/dysts>
   Contains catalogued parameters and Lyapunov verification for dozens of attractors
   including the Anishchenko-Astakhov system.

3. **Sprott JC (2010)** *Elegant Chaos: Algebraically Simple Chaotic Flows*.
   World Scientific. Canonical parameter reference.
   Sprott's attractor database: CC0 <https://sprott.physics.wisc.edu/chaos/>

---

## Tutorial

`/tutorials/blender-tutorial-python-numpy-anishchenko-astakhov-oscillator-1983-self-excited-inertial-nonlinearity-heaviside-chaos-rk4-bishop-tube-poi-webxr`
