# L-System Coral — Lindenmayer Turtle 3D Branch Geometry

**Blender 5.1 | Python bpy + mathutils | CC0**

Generates a bioluminescent branching coral from a three-symbol Lindenmayer
production rule using a 3D turtle interpreter. At GENERATIONS=5 the system
produces 121 tube segments spanning three rotation axes (+/- yaw, &/^ pitch,
\/  roll). All branches are POLY splines in a single Curve object — taper is
applied per control point via `.radius` scaling of `bevel_depth`. Exports a
Draco-compressed GLB for WebXR or FFF/MSLA 3D printing as a light-sculpture
armature.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full production script — expand L-string, walk turtle, build Curve, export GLB |
| `record.py` | Viewport grow animation (Z-scale keyframes) + OpenGL render to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS settings and session script for `screen.mp4` |
| `.expected-artefacts.json` | Manifest of output files |

## Quick Start

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → Run Script (Alt+P)
3. Coral appears in viewport; GLB saved as `hf_l_system_coral.glb` beside the `.blend`

## Parameters

Adjust at the top of `blueprint.py`:

```python
GENERATIONS = 5      # raise to 6 for 364 branches; lower to 3 for fast preview
ANGLE_DEG   = 27.0   # degrees — try 15–35° range
STEP_ROOT   = 0.50   # m — scale the whole structure
TAPER_STEP  = 0.72   # child branch length multiplier
BEVEL_DEPTH = 0.022  # m — trunk tube radius
```

## Theory Reference

- Prusinkiewicz & Lindenmayer, *The Algorithmic Beauty of Plants* (1990) §1.3
- The coral rule `A → F[+&A][-&A][^A]` at angle 27° approximates Fig. 1.24c
- Symbol `&` rotates around the local right axis (pitch), giving the third spatial
  dimension that pure yaw (`+/-`) rules lack
