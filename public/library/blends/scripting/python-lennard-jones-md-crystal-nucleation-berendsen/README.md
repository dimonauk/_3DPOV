# Python — 2D LJ Molecular Dynamics: Crystal Nucleation (Blender 5.1)

**Slug:** `python-lennard-jones-md-crystal-nucleation-berendsen`  
**Category:** scripting  
**Blender:** 5.1  
**Licence:** CC0

## What this is

100 point-mass particles in a 2D periodic box interacting via the Lennard-Jones
potential. A Berendsen thermostat cools the system from T*=2.0 (hot disordered
liquid) to T*=0.35 (hexagonal crystal) over 240 Blender frames. Crystal
nucleation — the spontaneous formation of ordered domains — is visible around
frame 150 as small triangular patches where atoms lock into equilateral-triangle
arrangements with spacing r₀ = 2^(1/6)σ ≈ 1.12σ.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Runs the LJ-MD simulation with numpy; builds the Blender scene |
| `record.py` | Renders `viewport.mp4` in background mode |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_lj_crystal.blend` | Output of `blueprint.py` (generated) |

## Running

```bash
# Generate the .blend file (takes ~2 min for 100 particles × 240 frames)
blender --background --python blueprint.py

# Render viewport.mp4
blender hf_lj_crystal.blend --background --python record.py
```

## Key parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| `N_PART` | 100 | Particle count (O(N²) force cost) |
| `L_BOX` | 11.0 σ | Box side; density ρ*=N/L²≈0.826 |
| `T_START` | 2.0 | Initial temperature (hot liquid) |
| `T_END` | 0.35 | Final temperature (crystal ≤0.45) |
| `DT` | 0.005 τ | Time step |
| `N_SUBSTEPS` | 8 | Substeps per Blender frame |

## Physics summary

V(r) = 4ε[(σ/r)¹² − (σ/r)⁶] — repulsive at r < r₀, attractive for r > r₀.
Crystal equilibrium spacing r₀ = 2^(1/6)σ ≈ 1.122σ.
2D LJ solid–liquid transition at ρ*≈0.826: T*_melt ≈ 0.45–0.55.
Berendsen thermostat: λ = √(1 + dt/τ_B · (T_target/T_curr − 1)).
