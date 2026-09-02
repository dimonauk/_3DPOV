# Halvorsen Attractor
### Python · NumPy · RK4 · Bishop Parallel-Transport Tube · Poi Head for WebXR — Blender 5.1

**Category**: scripting  
**Blender**: 5.1  
**Licence**: CC0  
**Source**: Attributed to Torsten Halvorsen (~1998); catalogued in  
Sprott JC (2010) *Elegant Chaos: Algebraically Simple Chaotic Flows*  
World Scientific — [sprott.physics.wisc.edu/chaos/elegantchaos.htm](https://sprott.physics.wisc.edu/chaos/elegantchaos.htm)

---

## What this makes

A 3 200-waypoint Bishop-frame tube threaded through the Halvorsen strange
attractor in 3-D phase space, exported as a Draco-6–compressed GLB for WebXR.
Vertex colour `Halvors_Speed` (FLOAT_COLOR) maps orbital speed to a cobalt–amber
emission gradient; four shape keys expose how the dissipation parameter `a`
controls lobe width, separation, and symmetry.

---

## The system

```
ẋ = −a·x − 4·y − 4·z − y²
ẏ = −a·y − 4·z − 4·x − z²
ż = −a·z − 4·x − 4·y − x²
```

Canonical: `a = 1.89`

### C₃ cyclic symmetry

The cyclic permutation σ : (x, y, z) → (y, z, x) leaves the equations
invariant.  Substitute and verify:

```
σ(ẋ) = ẏ = −a·y − 4·z − 4·x − z²   ← same as ẏ  ✓
```

Every point on the attractor has two symmetry-related copies; the three lobes
in the 3-D portrait are literally the same sub-orbit permuted by σ.

### Divergence

```
∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = −a + (−a) + (−a) = −3a = −5.67
```

Constant everywhere in phase space — the same class as Lorenz and Thomas.

### Lyapunov spectrum (a = 1.89)

| Exponent | Value |
|----------|-------|
| λ₁       | ≈ +0.078 |
| λ₂       | ≈  0     |
| λ₃       | ≈ −5.75  |
| Sum      | ≈ −5.67 = ∇·F ✓ |

Kaplan–Yorke dimension: D_KY = 2 + λ₁/|λ₃| ≈ **2.014**  
Lyapunov time: τ = 1/λ₁ ≈ **12.8 time units**

---

## Shape keys

| Key | Parameter | Effect |
|-----|-----------|--------|
| `Basis`    | a = 1.89 | Canonical three-lobe C₃-symmetric chaos |
| `SK_Wide`  | a = 1.40 | Near onset — wider orbit, λ₁ ≈ +0.04 |
| `SK_Tight` | a = 2.30 | Stronger dissipation — lobes shrink in z |
| `SK_Trans` | a = 1.60 | Period-doubling transition, asymmetric lobes |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 script — RK4, Bishop tube, vertex colour, shape keys, GLB export |
| `record.py` | 300-frame viewport orbit animation (EEVEE Next, bloom) |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4`; includes the C₃ symmetry top-view shot guide |
| `.expected-artefacts.json` | CI/manifest metadata |

---

## Quick start

```bash
blender --background --python blueprint.py
```

Or paste into the Blender Text Editor and click **Run Script**.  The mesh
`hf_halvorsen_poi` appears and `hf_halvorsen_poi.glb` is exported alongside
the blend file.
