# Thomas' Cyclically Symmetric Attractor — Labyrinth Chaos

**Topic**: Chaos theory, strange attractors, ODE integration, symmetry analysis  
**Blender version**: 5.1  
**Output**: `hf_thomas.glb` — three interlocked poi light trails for WebXR  
**Licence**: CC0 (blueprint) · Public domain (mathematics)

## What this is

René Thomas (1999) introduced a cyclically symmetric three-variable ODE system
to study "labyrinth chaos" — orbits that wander diffusively across all of ℝ³
through a network of phase-space corridors, never repeating. The system has
exact Z₃ cyclic symmetry: the equations are invariant under (x,y,z)→(y,z,x).
We exploit that symmetry to build three colour-coded poi light trails that are
geometric rotations of each other.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 Python script — integrate + build + export |
| `record.py` | 192-frame viewport orbit render script |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

```bash
blender --background --python blueprint.py
```

Produces `hf_thomas.glb` alongside the .blend (or in the current directory
if run without a .blend file).

## Parameters to experiment with

| Constant | Default | Effect |
|----------|---------|--------|
| `B` | `0.208` | Damping. `0.208186` is the bifurcation point. Try `0.19` for labyrinth chaos. |
| `T_SPAN` | `(0, 500)` | Integration duration. Longer → more loops filled. |
| `DOWNSAMPLE` | `6` | Spline control density. Lower → smoother tube, larger file. |
| `BEVEL_R` | `0.010` | Tube radius in metres. |
| `SCALE` | `0.28` | World scale. Attractor spans ≈±7 Thomas units → ±2 m scene. |

## The labyrinth chaos regime

Set `B = 0.19` and `T_SPAN = (0, 5000)` to see the diffusing orbit. Warning:
this produces a very large spline — consider increasing `DOWNSAMPLE` to 20.
The trajectory will escape the bounded region, wandering through sinusoidal
"corridors" in phase space. This is what Thomas called labyrinth chaos.

## Related tutorials

- [Lorenz Attractor (GN Simulation Zone)](/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting)
- [Rössler Attractor (Python RK4)](/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting)
- [Duffing Oscillator (Period Doubling)](/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr)
