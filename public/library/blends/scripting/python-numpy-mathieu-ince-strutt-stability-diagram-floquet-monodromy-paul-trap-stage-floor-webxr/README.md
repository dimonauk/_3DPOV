# Mathieu Equation — Ince–Strutt Stability Diagram
## Floquet Monodromy Matrix · Vectorised RK4 · Stage Floor for WebXR

**Blender 5.1 · bpy + numpy · CC0**

---

## What this produces

A 4 m × 5 m stage-floor mesh (160 × 140 quad grid, 22,400 vertices) whose
height encodes the Floquet growth exponent λ of the Mathieu equation

```
ẍ + (a − 2q cos 2t) x = 0
```

at every point (a, q) in the Ince–Strutt parameter plane. Cobalt valleys are
stable (bounded oscillations); amber ridges are parametric-resonance tongues
where amplitude grows as e^{λt}.

Three instability tongues are visible:
- **Tongue n=0** — centred on the q-axis (a ≈ 0), the DC-drive resonance.
- **Tongue n=1** — centred near a ≈ 1 (ω = ω₀), principal parametric resonance.
- **Tongue n=2** — centred near a ≈ 4 (ω = 2ω₀), second harmonic resonance.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Blender script — build & export |
| `record.py`    | Viewport animation keyframes |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `hf_ince_strutt.blend` | Blender file (after running blueprint) |
| `hf_ince_strutt.glb` | Draco-6 WebP GLB for WebXR |

## How to run

```
blender --python blueprint.py
```
Or paste into Blender's Text Editor and press Alt+P.

## Maths depth

**Floquet theory** (Floquet 1883): every linear ODE with periodic coefficients
`ẋ = A(t)x`, `A(t+T) = A(t)`, has a fundamental matrix of the form
`Φ(t) = P(t) e^{Bt}` where P is T-periodic. The *monodromy matrix*
`M = Φ(T, 0)` encodes one full period of evolution. Its eigenvalues
`ρ = e^{μT}` are the *Floquet multipliers*; `μ` is the Floquet exponent.

For the Mathieu equation (a real symmetric 2×2 system), the Wronskian is
preserved (`det M = 1`) so the two multipliers satisfy `ρ₁ρ₂ = 1`. If both
lie on the unit circle, oscillations are bounded (stable). If one has
`|ρ| > 1`, amplitude grows exponentially (unstable).

The trace shortcut: `tr(M) = c(π) + s'(π)` where c, s are the cosine-like
and sine-like fundamental solutions. `|tr(M)/2| ≤ 1` → stable.

**Paul ion trap** (Nobel 1989): operates near `(a, q) ≈ (0.237, 0.706)`,
inside the first stability triangle. Choosing (a, q) in this region ensures
all three spatial modes (x, y, z) are simultaneously stable.

## Mesh statistics (expected)

| Property | Value |
|---|---|
| Vertices | 22,400 |
| Quad faces | 22,101 |
| Shape keys | 3 (Basis, SK_Exaggerated, SK_Flat) |
| Colour attribute | Col (FLOAT_COLOR, POINT) |
| GLB size (approx) | 420 KB |

## Licence

Blueprint CC0. Mathieu / Floquet mathematics: public domain.
NIST DLMF §28 source: US Government, public domain.
