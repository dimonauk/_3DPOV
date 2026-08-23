# Foucault Pendulum · Berry Phase · Hannay Angle
**Blender 5.1 — pure-bpy / numpy scripting — Poi Disc for WebXR**

Slug: `python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr`

---

## What this makes

A closed-loop Bishop parallel-transport tube tracing the analytic
Foucault pendulum rosette — the path swept by the bob's extremity over
one complete precession cycle. In the Basis shape (7 petals) the tube
self-intersects fourteen times, weaving a flat disc whose top view
shows the classical rosette and whose edge-on view shows the 5.6 mm
disc thickness created by the tube radius.

FLOAT_COLOR attribute `Foucault_Phase` runs cobalt → amber along the
temporal direction of precession, so the cobalt "petals" always lead
and the amber ones trail — the direction of Earth's rotation is
encoded in the colour.

Shape keys expose four "latitudes":

| Key | Petals | Equivalent λ | T_prec (scaled) |
|---|---|---|---|
| Basis | 7 | ~51° (London) | 7 × T_pend |
| SK_Arctic | 5 | ~65° (Arctic) | 5 × T_pend |
| SK_Subtropical | 9 | ~30° (Gulf of Suez) | 9 × T_pend |
| SK_Tropical | 12 | ~22° (Tropic of Cancer) | 12 × T_pend |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full production Blender script — run once in headless or interactive |
| `record.py` | Viewport animation script — run after blueprint.py |
| `README.md` | This file |
| `SCREEN-RECORDING-NOTES.md` | OBS / Blender Game Bar screen-capture guide |
| `.expected-artefacts.json` | CI manifest for expected outputs |
| `hf_foucault_poi.blend` | Output blend file (created by blueprint.py) |
| `hf_foucault_poi.glb` | WebXR-ready GLB (Draco-6, WebP, +Y-up) |

---

## Quick start

```bash
blender --background --python blueprint.py
blender hf_foucault_poi.blend --python record.py
```

---

## Physics summary

**Rotating-frame ODE** (Coriolis-reduced, z-component only):
```
z̈ + 2i·Ω_z·ż + ω₀²·z = 0,    z = x + iy
```

**Analytic solution** (initial displacement A along x, zero velocity):
```
z(t) = A · cos(ω′t) · exp(−i·Ω_z·t)
     = A · cos(ω₀t) · [cos(Ω_z t) − i·sin(Ω_z t)]
```
where ω′ = √(ω₀² + Ω_z²) ≈ ω₀ to first order in Ω_z/ω₀.

**Closure**: z(2π/Ω_z) = A·cos(2π·N_PETALS) = A for integer N_PETALS → 
the trajectory closes after exactly N_PETALS full pendulum swings.

**Berry / Hannay phase**:
```
γ = 2π·sin(λ)  radians per sidereal day
```
This is the holonomy of the Levi-Civita connection on S²
accumulated along the latitude circle at latitude λ.
The solid angle subtended by the spherical cap north of λ is
Ω_cap = 2π(1 − sin λ), and γ + Ω_cap = 2π (partition of the
northern hemisphere).

---

## Mesh statistics (Basis)

| Property | Value |
|---|---|
| Trajectory samples N_TRAJ | 2800 |
| Tube cross-section sides | 8 |
| Total vertices | 22 400 |
| Total quad faces | 22 400 |
| Petals (Basis) | 7 |
| Tube radius | 2.8 mm |
| Outer radius AMPLITUDE | 70 mm |
| Shape keys | Basis, SK_Arctic, SK_Subtropical, SK_Tropical |

---

## Cross-references

- [Euler Rigid Body Spinning Top & Precession](/tutorials/blender-tutorial-python-numpy-euler-rigid-body-spinning-top-precession-poi-staff) — companion precession tutorial
- [Hopf Fibration S³→S² Fiber Bundle](/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr) — same parallel-transport holonomy on S²
- [ABC Flow Beltrami & RK4 Streamlines](/tutorials/blender-tutorial-python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr) — RK4 trajectory technique

---

## Licence

CC0 — Holoflow Studio. The analytic solution is public-domain
classical mechanics. Outside references: Foucault 1851 (PD); SciPy
docs (BSD-3-Clause).
