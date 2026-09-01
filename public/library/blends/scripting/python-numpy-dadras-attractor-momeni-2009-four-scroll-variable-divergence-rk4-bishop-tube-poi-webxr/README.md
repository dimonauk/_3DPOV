# Dadras–Momeni Attractor (2009)  
### Python · NumPy · RK4 · Bishop Parallel-Transport Tube · Poi Head for WebXR — Blender 5.1

**Category**: scripting  
**Blender**: 5.1  
**Licence**: CC0  
**Source**: Dadras S & Momeni HR (2009) *Phys Lett A* 373(36):3637–3642  
DOI [10.1016/j.physleta.2009.07.088](https://doi.org/10.1016/j.physleta.2009.07.088)

---

## What this makes

A smooth 3,000-waypoint Bishop-frame tube threaded through the Dadras strange
attractor in 3-D phase space, exported as a Draco-compressed GLB for WebXR.
Vertex colour `Dadras_Speed` (FLOAT_COLOR) maps orbital speed to a cobalt–amber
emission gradient; four shape keys demonstrate how a single parameter switches
the attractor between 2- and 4-lobe topologies.

---

## The system

$$\dot{x} = y - p\,x + q\,y\,z \qquad \dot{y} = r\,y - x\,z + z \qquad \dot{z} = s\,x\,z - t\,z$$

Canonical parameters: `p=3, q=2.7, r=1.7, s=2, t=9`

**Key property — variable divergence:**

$$\nabla \cdot F = -p + r + (s\,x - t) = -10.3 + 2x$$

Unlike Lorenz or Thomas, volume contraction varies with position.
The trajectory self-organises so the time-average is negative,
satisfying Liouville's theorem, while locally the rate swings from
≈ −14 (deep left lobe) to ≈ −6 (right lobe).

**Lyapunov spectrum** (q = 2.7): λ₁ ≈ +0.47, λ₂ ≈ 0, λ₃ ≈ −4.47  
**Kaplan–Yorke dimension**: D_KY = 2 + λ₁/|λ₃| ≈ 2.105

---

## Shape keys

| Key | Parameters | Topology |
|---|---|---|
| `Basis` | p=3 q=2.7 r=1.7 s=2 t=9 | 4-scroll butterfly |
| `SK_TwoScroll` | q=1.0 | 2-scroll figure-eight |
| `SK_Compact` | s=3.0 | tighter z-coiling |
| `SK_WidePinch` | p=2.0 | broader lobe spread |

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Blender 5.1 script — mesh, colours, shape keys, GLB export |
| `record.py` | 300-frame viewport animation + camera orbit render |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI/manifest metadata |

---

## Integration parameters

```
DT       = 5e-4    # RK4 step — tuned for z-decay stiffness (−t = −9)
N_WARMUP = 10,000  # transient discard
N_STEPS  = 90,000  # main run
THIN     = 30      # keep every 30th point → 3,000 waypoints
```

---

## Cross-references

**Studio**  
- [Rössler Attractor tutorial](/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr)  
- [Chen Attractor tutorial](/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr)  
- [Thomas Cyclically-Symmetric Attractor tutorial](/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr)

**Outside sources**  
- Dadras S & Momeni HR (2009) *Phys Lett A* 373:3637–3642 — system derivation and multi-scroll analysis  
- NumPy Developers, BSD-3-Clause, [https://numpy.org](https://numpy.org) — integration and frame geometry  
- Sprott JC (2010) *Elegant Chaos*, World Scientific — classification of three-scroll families (related: SprottJC/attractors C code, MIT)
