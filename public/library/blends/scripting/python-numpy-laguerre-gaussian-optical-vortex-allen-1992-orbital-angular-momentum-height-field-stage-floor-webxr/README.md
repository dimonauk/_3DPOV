# Laguerre–Gaussian Optical Vortex Beams
## Allen, Beijersbergen, Spreeuw & Woerdman (1992)

**Type**: Stage-floor height field — 128×128 quads (16 384 V, 16 129 Q)  
**Blender**: 5.1  **Licence**: CC0  **Topic**: scripting / quantum optics

---

## What this is

A Laguerre–Gaussian (LG) beam is an exact solution of the paraxial wave
equation whose amplitude envelope is described by an associated Laguerre
polynomial in the radial direction and a helical phase factor exp(i·l·φ) in
the azimuthal direction.  The integer l is the **topological charge** — it
counts how many times the optical phase winds by 2π around the beam axis.

At the phase singularity (r=0 on axis), the field is identically zero because
exp(i·l·φ) is undefined at the origin.  The result is a dark hollow at the
beam centre surrounded by one or more bright rings.  Each photon in the beam
carries ℏl of **orbital angular momentum (OAM)** — a mechanical torque on
absorbing objects, completely independent of circular polarisation (spin AM).

Allen, Beijersbergen, Spreeuw and Woerdman demonstrated this in 1992 using a
mode converter made from two cylindrical lenses, producing the first
controlled beam with quantised OAM.  Today LG beams drive optical tweezers,
free-space optical communications, and quantum information protocols.

---

## Shape keys

| Key    | l | p | Geometry                              |
|--------|---|---|---------------------------------------|
| Basis  | 1 | 0 | Single ring — one dark centre        |
| SK_l2  | 2 | 0 | Wider ring — charge-2 vortex         |
| SK_l3  | 3 | 0 | Even larger ring — charge-3           |
| SK_p1  | 1 | 1 | Two concentric rings — p=1 radial    |

---

## Colour attribute: LG_Phase

`|sin(l·φ/2)|` mapped cobalt→amber gives l "petal" lobes that make the
topological charge immediately legible by colour.  In WebXR the attribute
appears via Named Attribute → Base Color in the PBR material.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the mesh, shape keys, material, and exports GLB |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS recording shot list |
| `.expected-artefacts.json` | CI artefact manifest |
| `lg_vortex_floor.blend` | Blender scene (generated) |
| `lg_vortex_floor.glb` | WebXR-ready GLB (generated) |

---

## Running blueprint.py

```bash
# From Blender's built-in Python scripting workspace:
# 1. Open a new Blender scene (File → New)
# 2. Switch to Scripting workspace
# 3. Open blueprint.py
# 4. Click Run Script
# Output: lg_vortex_floor.blend + lg_vortex_floor.glb
# alongside blueprint.py
```

---

## Outside sources

- Allen L, Beijersbergen MW, Spreeuw RJC, Woerdman JP (1992)
  "Orbital angular momentum of light and the transformation of
  Laguerre–Gaussian laser modes" *Phys. Rev. A* **45**(11):8185–8189.
  https://doi.org/10.1103/PhysRevA.45.8185
  *(Academic citation; equations are in the public domain)*

- NumPy BSD-3-Clause https://numpy.org  github.com/numpy/numpy

- NIST DLMF §18.3 Laguerre polynomials — US Government public domain
  https://dlmf.nist.gov/18.3

---

## Related studio entries

- [Spherical Harmonics — atomic orbitals](/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr)
- [Hopf Fibration — linked tori](/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr)
- [Tight-Binding Band Structure](/tutorials/blender-tutorial-python-numpy-tight-binding-2d-square-lattice-dispersion-fermi-surface-van-hove-singularity-stage-floor-webxr)
