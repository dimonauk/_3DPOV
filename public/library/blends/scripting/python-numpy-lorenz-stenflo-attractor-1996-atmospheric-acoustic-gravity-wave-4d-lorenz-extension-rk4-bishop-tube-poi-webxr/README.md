# Lorenz-Stenflo Attractor — Atmospheric Acoustic-Gravity Waves

**Blender 5.1 · Python + NumPy · 4D ODE · Bishop Parallel-Transport Tube**

## What this is

The *Lorenz-Stenflo attractor* is a four-dimensional extension of the Lorenz
system published by Lennart Stenflo in 1996.  Stenflo added a fourth ODE
variable **w** representing the amplitude of acoustic-gravity waves — pressure
oscillations that propagate through density-stratified air — and coupled it
back into the horizontal momentum equation via the parameter **s**.

When **s = 0**, the variable w simply decays (ẇ = −σw) without feeding back
into x, and the system reduces to a Lorenz-family variant.  As **s** grows,
the acoustic channel injects energy into the convective rolls, distorting the
familiar butterfly topology into a twisted, asymmetric scroll that has no
exact three-dimensional counterpart.

The blueprint integrates the 4D ODE with RK4 at DT = 0.005, projects
the trajectory onto **(x, y, z)** for the mesh, and encodes **w** as a
cobalt–amber FLOAT_COLOR vertex attribute.  The result is a WebXR poi head GLB.

## Equations

```
ẋ = σ(y − x) + s·w       ← acoustic coupling into momentum
ẏ = r·x − y − x·z
ż = x·y − b·z
ẇ = −x − σ·w             ← acoustic wave with x-driven source

Canonical  σ = 0.7   r = 26   b = 8/3   s = 1.5
```

## Fixed points

| Point | (x, y, z, w) |
|---|---|
| O   | (0, 0, 0, 0) — unstable saddle |
| P+  | (+3.795, +15.41, 21.939, −5.42) |
| P−  | (−3.795, −15.41, 21.939, +5.42) |

Derivation: w* = −x*/σ from ẇ=0, then y* = x*(σ²+s)/σ² from ẋ=0,
z* = r−(σ²+s)/σ² from ẏ=0, x*² = b·z*/[(σ²+s)/σ²] from ż=0.

## Divergence (constant)

```
∇·F = −(2σ + 1 + b) ≈ −5.07
```

Constant divergence means Liouville's theorem gives Σλᵢ = −5.07 exactly.
Compare the standard Lorenz: ∇·F = −(σ+1+b) ≈ −14.67 — the Stenflo system
dissipates more slowly, allowing richer orbital geometry.

## Lyapunov spectrum (canonical, approximate)

| Exponent | Value | Meaning |
|---|---|---|
| λ₁ | ≈ +0.122 | primary chaos |
| λ₂ | ≈  0     | orbit-tangent direction |
| λ₃ | ≈ −0.44  | |
| λ₄ | ≈ −4.75  | strong contraction |
| **D_KY** | **≈ 2.28** | Kaplan–Yorke dimension |

## Shape keys

| Key | s | r | Behaviour |
|---|---|---|---|
| Basis      | 1.5 | 26 | Canonical Stenflo attractor |
| SK_WeakS   | 0.5 | 26 | Weak coupling → orbit contracts toward Lorenz limit |
| SK_StrongS | 3.0 | 26 | Strong acoustic distortion → wider, asymmetric wings |
| SK_HighR   | 1.5 | 35 | Higher Rayleigh → broader butterfly, stronger driving |

## Colour attribute

`LS_Stenflo_W` (FLOAT_COLOR, POINT domain):  
cobalt `(0.03, 0.20, 0.78)` = w at minimum → amber `(0.98, 0.62, 0.05)` = w at maximum.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Blender 5.1 Python script |
| `record.py` | Viewport animation render (OpenGL, 240 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `lorenz_stenflo_poi.blend` | Blender scene (generated on Dimona's machine) |
| `lorenz_stenflo_poi.glb` | WebXR-ready export (Draco-6, FLOAT_COLOR) |
| `viewport.mp4` | OpenGL render output |
| `screen.mp4` | OBS screen capture |

## Outside source

L. Stenflo, "Generalized Lorenz equations for acoustic-gravity waves in the
atmosphere", *Physica Scripta* **53**(1):83–84, 1996.
DOI: 10.1088/0031-8949/53/1/015  
Equations are mathematical objects in the public domain.
