# Mantaflow Gaseous Simulation: Smoke & Fire — Torch Flame

**Blender 5.1 · Physics · CC0 · Holoflow Studio**

A torch flame built on Mantaflow's purely Eulerian gas solver.  A sphere emitter
continuously injects fuel (INFLOW / FIRE type); combustion converts fuel to heat
and soot smoke; buoyancy forces the column upward; vorticity confinement prevents
the unphysical laminar-pillar look; a Turbulence force field adds lateral flicker.
A three-attribute Principled Volume material (density, flame, heat) renders smoke
and fire in a single EEVEE Next pass.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene, saves `flame_torch.blend`; manual Bake All required |
| `record.py` | 180° orbit EEVEE render → `viewport.mp4` (run after bake) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# Step 1: build scene
blender --background --python blueprint.py

# Step 2: open in UI and bake (Mantaflow requires interactive bake)
blender flame_torch.blend
# → select flame_domain → Properties → Physics → Fluid → Bake All
# Expect 2–8 minutes at Resolution 80 on a modern CPU

# Step 3: render viewport MP4
blender --background flame_torch.blend --python record.py
```

## Key Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| `RESOLUTION` | 80 | Voxels along longest axis — 128 = ×2.5 memory |
| `VORTICITY` | 0.25 | 0=straight pillar, 0.5=coiling, 1.0+=chaotic |
| `FUEL_AMOUNT` | 0.55 | Flame height; 1.0=bonfire scale |
| `BURNING_RATE` | 0.70 | Fuel→heat speed; lower = slow cold combustion |
| `FLAME_SMOKE` | 0.85 | Smoke per unit fuel burned (campfire=high, clean flame=low) |
| `TURB_STRENGTH` | 5.0 | Flicker intensity; 0=laminar, 10+=violent |

## Gas vs Liquid Mantaflow

| Feature | Gas (this file) | Liquid (dam-break) |
|---------|-----------------|--------------------|
| Algorithm | Eulerian grid only | FLIP (hybrid Eulerian–Lagrangian) |
| Particles | None | FLIP particles carry velocity |
| Surface | Density field | Isosurface from particle cloud |
| Vorticity | Confinement term | Not needed (particles preserve it) |
| Render | EEVEE volumetric | Cycles (transmission + refraction) |

## Tutorial

[/tutorials/blender-tutorial-physics-mantaflow-smoke-fire-torch](/tutorials/blender-tutorial-physics-mantaflow-smoke-fire-torch)

## Outside Sources

- [Blender Manual — Fluid Domain Gas](https://docs.blender.org/manual/en/latest/physics/fluid/type/domain/gas.html) — CC-BY-SA 4.0 · Blender Foundation
- [njanakiev/blender-scripting](https://github.com/njanakiev/blender-scripting) — MIT · Nicolas Janakiev
