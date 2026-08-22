# Chirikov–Taylor Standard Map — Stage Floor (Blender 5.1)

**Technique:** Python numpy scripting  
**Topic:** Area-preserving 2-torus map, KAM theory, Poincaré section density height field  
**Category:** Stage floor (WebXR)  
**Blender:** 5.1  
**Licence:** CC0

---

## What this is

The **Chirikov–Taylor standard map** is the prototype of chaotic area-preserving
Hamiltonian systems.  Its one-parameter family encapsulates the entire
integrable→chaotic transition:

```
p_{n+1} = p_n + K·sin(θ_n)   (mod 2π)
θ_{n+1} = θ_n + p_{n+1}       (mod 2π)
```

`K` is the **stochasticity parameter**.  At `K = 0` the map is integrable;
at `K = K_c ≈ 0.9716` (Greene's criterion, 1979) the last KAM torus breaks.
Above `K_c` the chaotic sea is globally connected.

The script runs 180 stratified trajectories × 3500 map iterations, accumulates
a 96×96 hit-count histogram over the 2-torus T², log-normalises, and extrudes
each cell as a height-field vertex.  The result is a 4 m × 4 m stage floor
whose topology is a **Poincaré section** of the underlying Hamiltonian flow.

---

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Expert-grade Blender 5.1 script |
| `record.py` | Viewport-animation render (shape-key morph sequence) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable output manifest |

**Generated outputs** (run blueprint.py in Blender):

| Artefact | Path |
|----------|------|
| `hf_chirikov_floor.blend` | `public/library/glbs/scripting/<slug>/` |
| `hf_chirikov_floor.glb` | same — Draco-6, WebP, morph targets |

---

## Shape keys

| Name | K value | Physics |
|------|---------|---------|
| `Basis` | 0.9716 | Greene's threshold — last KAM torus barely intact |
| `SK_Integrable` | 0.00 | Fully integrable; all orbits horizontal (action conserved) |
| `SK_Partial` | 0.50 | Most KAM tori intact; Poincaré–Birkhoff island chains visible |
| `SK_Chaotic` | 2.00 | Large chaotic sea; only small residual islands |
| `SK_Wild` | 5.00 | Accelerator modes; anomalous diffusion in action |

---

## Vertex colour

`FLOAT_COLOR` attribute `Chirikov_Density` on `CORNER` domain:

- **Amber** `(0.90, 0.58, 0.07)` — high-density bins (KAM ridges, island centres)
- **Cobalt** `(0.05, 0.14, 0.68)` — low-density bins (chaotic sea, ergodic background)

---

## Key parameters

```python
GRID      = 96       # cells per axis (96²=9 216 quads)
N_TRAJ    = 180      # initial conditions (stratified)
N_ITER    = 3500     # map steps per trajectory
H_SCALE   = 0.35    # max height (m) at saturated bin
FLOOR_SIZE = 4.0    # floor extent (m)
```

Increase `GRID` to 192 and `N_TRAJ` to 512 for publication-grade density;
expect ~40 s compute on a modern CPU (all vectorised numpy).

---

## Outside sources

1. **Chirikov BV (1979)** "A universal instability of many-dimensional oscillator
   systems." *Physics Reports* 52(5):263–379.  
   Preprint: CERN-77-11. https://cds.cern.ch/record/185478 (CERN open institutional report).  
   Introduced the standard map and defined the stochasticity parameter.

2. **Meiss JD (1992)** "Symplectic maps, variational principles, and transport."
   *Rev. Mod. Phys.* 64(3):795–848.  
   Author's PDF: https://amath.colorado.edu/faculty/jdm/papers/SymplecticMaps.pdf  
   Comprehensive review of the standard map, transport theory, turnstiles, and cantori.
