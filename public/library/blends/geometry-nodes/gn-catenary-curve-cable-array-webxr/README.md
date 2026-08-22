# GN Catenary Curve — Hanging Cable Array for WebXR Interior Scenes

**Blender 5.1 | Geometry Nodes | CC0 | Holoflow Studio Library**

A Geometry Nodes modifier group that generates physically exact catenary curves
from two parameters — Span and Sag Parameter — then sweeps a tapered hexagonal
profile to produce WebXR-ready cable mesh.  Five parallel cables are arrayed
along the Y axis and exported as a single GLB for use in `@react-three/fiber`
or raw Three.js scenes.

## Catenary vs Parabola

The catenary (Latin: *catena* = chain) is the curve a perfectly flexible, uniform
chain takes when suspended under gravity between two fixed points.  It is described
by `y = a·cosh(x/a)` — where `a` is the *catenary parameter*, the ratio of
horizontal tension to linear weight density.

A parabola is only a valid approximation when sag/span < 0.05.  At the scales
typical of WebXR prop wiring (sag/span ≈ 0.10–0.40), the difference is visible
to the eye.  This blueprint uses the exact formula.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Headless bpy script — builds scene, applies modifier, exports GLB |
| `record.py` | Animates Sag Parameter 4.0→0.25→4.0, renders 90-frame EEVEE clip |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen recording |
| `output/cable_array.blend` | Generated blend file (run blueprint.py first) |
| `output/cable_array.glb` | Generated GLB ready for WebXR import |

## Usage

```bash
# Generate blend + GLB
blender --background --python blueprint.py

# Render viewport animation (requires output/cable_array.blend)
blender --background output/cable_array.blend --python record.py
```

## Parameters

| Name | Default | Effect |
|---|---|---|
| `SPAN` | 4.0 m | Horizontal distance between endpoints |
| `SAG_PARAM` | 1.20 | Catenary 'a': lower = more droop |
| `RESAMPLE_PTS` | 32 | Spline sample count |
| `PROFILE_RES` | 6 | Profile circle segments (hexagonal) |
| `PROFILE_R` | 0.015 m | Cable radius |
| `CABLE_COUNT` | 5 | Parallel cable count |
| `CABLE_SPACING` | 0.40 m | Y gap between centrelines |

## Tutorial

Full walkthrough with step-by-step nodes, variations, and troubleshooting:
https://holoflow.co.uk/tutorials/blender-tutorial-gn-catenary-curve-cable-array-webxr
