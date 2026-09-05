# Aref Blinking Vortex — Chaotic Advection Poincaré Map

**Blender 5.1 · Python numpy · Stage Floor · WebXR**  
**Licence: CC0**

---

## What is this?

A 120×120 height-field mesh whose vertex heights encode the **stroboscopic
visit density** of 9 801 passive fluid particles advected by the Aref
blinking vortex system — the canonical two-dimensional, time-periodic flow
that first demonstrated *chaotic advection*.

The system alternates between two point vortices placed at (+a, 0) and (−a, 0)
with circulation Γ.  Each particle traces a circular arc during each half-period
(radius is conserved; only the angle advances), but the full-period map
M = M₂ ∘ M₁ is area-preserving and can be chaotic.

---

## Physical principle

Before Aref (1984), vigorous mixing was thought to require turbulence.  The
blinking vortex showed that a smooth, time-periodic, non-turbulent (Stokes-flow)
velocity field can produce **exponentially diverging particle trajectories**.

The single control parameter μ = ΓT/(2πa²) governs the transition:

| μ    | Character |
|------|-----------|
| 1.5  | Near-integrable — concentric KAM rings dominate |
| 3.0  | Poincaré–Birkhoff island chains appear |
| 4.0  | Coexistence — chaotic sea + surviving islands |
| 7.0  | Almost ergodic — density nearly flat |

---

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Blender 5.1 script — integrates map, builds mesh, exports GLB |
| `record.py` | Viewport-animation recorder — 8 s morph through μ shape keys |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

---

## Running

```bash
blender --background --python blueprint.py
```

Outputs: `aref_blinking_vortex_floor.blend` + `aref_blinking_vortex_floor.glb`

---

## Cross-references

**Studio surfaces**
- [FTLE / Lagrangian Coherent Structures](/tutorials/blender-tutorial-python-numpy-ftle-double-gyre-lagrangian-coherent-structures-ridge-height-field-stage-floor-webxr)
- [Chirikov Standard Map](/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr)
- [Kelvin–Helmholtz Shear Instability](/tutorials/blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr)

**External sources**
- Aref, H. (1984). Stirring by chaotic advection. *J. Fluid Mech.* 143, 1–21. [DOI:10.1017/S0022112084001233](https://doi.org/10.1017/S0022112084001233)
- Aref, H. (2002). The development of chaotic advection. *Phys. Fluids* 14(4), 1315–1325. [DOI:10.1063/1.1458932](https://doi.org/10.1063/1.1458932)

---

## Licence

Blueprint, record script, and documentation: CC0 (no rights reserved).  
Physical equations: public domain (mathematical fact).
