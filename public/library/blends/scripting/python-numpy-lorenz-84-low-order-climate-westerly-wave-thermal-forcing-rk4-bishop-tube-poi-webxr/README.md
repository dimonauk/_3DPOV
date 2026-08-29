# Lorenz 84 Low-Order Climate Model — Poi Head for WebXR

**Blender 5.1 · Python + NumPy · CC0 · Holoflow Studio**

A Bishop parallel-transport tube tracing 75 time units of the Lorenz-84
three-variable atmospheric ODE, exported as a Draco-6 GLB with four shape
keys showing canonical chaos, near-Hopf quasi-periodicity, a periodic limit
cycle, and high-asymmetry chaos.

## The system

Edward Lorenz published this model in 1984 as the simplest ODE that captures
large-scale atmospheric variability — including weather-blocking events and
multi-week circulation regimes:

```
ẋ = −y² − z² − ax + aF      westerly wind tendency
ẏ =  xy − bxz − y  + G      cosine-wave (Rossby) tendency
ż =  bxy + xz − z           sine-wave (Rossby) tendency

a = 0.25   thermal damping
b = 4.0    advection coupling
F = 8.0    differential heating (equator–pole gradient)
G = 1.0    asymmetric heating (land–sea contrast)
```

At F = 8, G = 1: strange attractor with λ₁ ≈ +0.044 (predictability ~23
time units) and Kaplan–Yorke dimension D_KY ≈ 2.06.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Pure-bpy script; run in Blender Scripting workspace |
| `record.py` | EEVEE animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions |
| `.expected-artefacts.json` | Artefact manifest and cross-references |
| `hf_lorenz84_poi.glb` | _(generated on run)_ Draco-6 GLB + morph targets |
| `viewport.mp4` | _(generated via record.py)_ 10 s viewport render |
| `screen.mp4` | _(recorded manually with OBS)_ |

## Shape keys

| Key | F | G | Dynamical regime |
|-----|---|---|-----------------|
| Basis | 8.0 | 1.0 | Strange attractor (canonical chaos) |
| SK_Hopf | 6.5 | 1.0 | Near-Hopf; limit cycle / 2-torus |
| SK_Periodic | 4.0 | 1.0 | Periodic orbit (well below Hopf) |
| SK_HighG | 8.0 | 3.0 | High land-sea contrast; altered chaos |

## Running

```bash
# In Blender 5.1 Scripting workspace, open and run blueprint.py
# Then open and run record.py to produce viewport.mp4
```

## Attribution

Lorenz EN (1984) Irregularity: A Fundamental Property of the Atmosphere.
*Tellus A*, 36A(2):98–110. DOI:10.1111/j.1600-0870.1984.tb00230.x
Mathematical content Public Domain.

NumPy contributors. BSD-3-Clause. <https://numpy.org>

## Related tutorials

- [Lorenz 63 Butterfly Attractor](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr)
- [Lorenz-96 Atmospheric Ring](/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr)
- [Halvorsen Attractor](/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr)
