# SPH Fluid Particles — GN Simulation Zone (Blender 5.1)

**Technique:** Smoothed Particle Hydrodynamics pressure + viscosity + bowl boundary  
**Slug:** `gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting`  
**Category:** geometry-nodes  
**Blender version:** 5.1  
**Licence:** CC0

## What this does

320 particles spiral out of a poi-throw emitter and fall into an invisible bowl
under simplified SPH forces. Each particle queries its single nearest spatial
neighbour via `IndexOfNearest`, applies a pressure repulsion and viscosity
velocity-blend, then integrates position with symplectic Euler. Particles glow
violet–cyan–white according to speed, producing light-painting trail aesthetics
against a near-black background.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds mesh emitter + GN simulation zone + emission material |
| `record.py` | Renders `viewport.mp4` (120 frames, EEVEE, 1280×720) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Physics summary

```
f_pressure  = K_PRESS · max(0, H − dist_ij) · normalize(pos_i − pos_j)
f_viscosity = K_VISC  · (vel_j − vel_i)
f_gravity   = (0, −6.0, 0) m/s²
f_bowl_xz   = −K_WALL · max(0, |xz_i| − BOWL_R) · normalize(xz_i)
f_floor     = +K_WALL · max(0, FLOOR_Y − pos_i.y) · Ŷ

vel_new = vel_i + (Σf) · DT          ← velocity update first
pos_new = pos_i + vel_new · DT       ← symplectic: uses vel_new
```

## Running

```bash
# In Blender Scripting workspace
exec(open("blueprint.py").read())   # build scene
exec(open("record.py").read())      # render viewport.mp4
```

## Expected artefacts

See `.expected-artefacts.json`.

## Outside sources

1. Müller, Charypar, Gross — "Particle-Based Fluid Simulation for Interactive
   Applications" — SCA 2003 (Public Domain / freely available academic paper)  
   <https://matthias-research.github.io/pages/publications/sca03.pdf>

2. Blender Foundation — Simulation Zone manual — CC-BY-SA-4.0  
   <https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html>

3. Blender Foundation — Index of Nearest node manual — CC-BY-SA-4.0  
   <https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/point/index_of_nearest.html>
