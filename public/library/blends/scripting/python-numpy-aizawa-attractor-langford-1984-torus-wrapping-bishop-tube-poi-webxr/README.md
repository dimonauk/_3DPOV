# Aizawa / Langford Torus-Wrapping Attractor — Bishop Tube Poi

**Blender version:** 5.1  
**Licence:** CC0  
**Topic:** Scripting → ODE integration → Bishop parallel-transport tube  
**WebXR role:** poi-head  

---

## What it is

The Aizawa attractor (equations attributed to Langford 1984) is a six-parameter
strange attractor that winds around a torus-like manifold without ever closing.
The orbit is chaotic: it looks periodic on short time-scales but never returns
to exactly the same position.

Equations:

```
ẋ = (z − b)·x − d·y
ẏ =  d·x + (z − b)·y
ż =  c + a·z − z³/3 − (x²+y²)·(1 + e·z) + f·x·z
```

Canonical parameters: `a=0.95  b=0.7  c=0.6  d=3.5  e=0.25  f=0.1`

The (x, y) pair is a damped harmonic rotator: the factor `(z−b)` acts as a
gain/loss coefficient.  When `z > b` the orbit spirals outward; when `z < b`
it contracts.  The z-oscillator is stabilised by the cubic term `−z³/3` but
driven upward by the orbit radius `r² = x²+y²`, so the two subsystems
continuously exchange energy through the term `−r²(1+ez)`.

**Divergence** (position-dependent, NOT constant):

```
∇·F = 2(z−b) + a − z² − e·r² + f·x
```

This differs from Lorenz/Rössler (constant divergence).  The attractor is
dissipative on average but the instantaneous rate of volume contraction varies
across the manifold.

**Lyapunov spectrum** (canonical): λ₁ ≈ +0.076, D_KY ≈ 2.015  
**Fixed points** (on z-axis): z₁ ≈ 1.944 (unstable saddle-focus), z₂ ≈ −0.835, z₃ ≈ −1.109

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Blender 5.1 script — runs in the Text Editor |
| `record.py` | Animates shape-key morph and renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |
| `hf_aizawa_poi.blend` | Saved .blend (created when you run the script) |
| `hf_aizawa_poi.glb` | WebXR export (Draco 6, WebP textures, +Y up) |

---

## Shape keys

| Key | Parameters changed | Visual effect |
|---|---|---|
| **Basis** | a=0.95, b=0.7, c=0.6, d=3.5, e=0.25, f=0.1 | Canonical toroidal winding |
| **SK_HighD** | d=5.5 (all others same) | Faster rotation → denser winding |
| **SK_NoEF** | e=0, f=0 (all others same) | Remove radial z-coupling; shifts topology |
| **SK_LowB** | b=0.45 (all others same) | Lower saddle threshold → wider orbit |

---

## References

- Langford WF (1984) "Numerical studies of torus bifurcations."  
  In: Küpper T, Mittelmann HD & Weber H (eds) *Numerical Methods for Bifurcation Problems*,  
  ISNM vol. 70, Birkhäuser Basel, pp. 285–295.  
  DOI: [10.1007/978-3-0348-6256-1_18](https://doi.org/10.1007/978-3-0348-6256-1_18)  
  *(Mathematical equations — public domain)*

- Sprott JC — Strange Attractors catalogue:  
  <https://sprott.physics.wisc.edu/chaostsa/>  
  *"Images and equations are free for any use."* (Effectively PD)

- Blender Python API — `bpy.data.meshes`, `color_attributes`, `shape_keys`:  
  <https://docs.blender.org/api/5.1/>
