# Python bpy.types.Curve — Bézier & NURBS Spline Data API

**Blender 5.1 · Scripting · CC0**

Builds Bézier S-curves and NURBS rings directly from the Python data API
(no operators, no context dependencies) and exports them as tube mesh
geometry in a GLB file ready for WebXR scenes.

## What this demonstrates

| Concept | Detail |
|---|---|
| `bpy.data.curves.new()` | Create CurveData without any operator |
| `splines.new('BEZIER')` | Add a Bézier spline to the data-block |
| `bezier_points.add(n)` | Append control points |
| Handle types | VECTOR / AUTO / ALIGNED / FREE — when each is correct |
| `splines.new('NURBS')` | Add a NURBS spline; homogeneous (x,y,z,w) coords |
| `order_u`, `use_cyclic_u` | Cubic smoothness and closed-loop NURBS rings |
| `bevel_depth` / `bevel_resolution` | Tube cross-section geometry |
| `bevel_factor_end` animation | Self-drawing cable reveal via keyframe |
| `object.convert(target='MESH')` | Mesh conversion for GLB export |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Production script — run from Scripting workspace |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

Open `blueprint.py` in the Blender Scripting workspace and press ▶ Run
Script. The S-cable and NURBS ring appear in the viewport; `cable_bezier.glb`
is written beside the `.blend` file.

To render the viewport animation:

```
blender --background --python record.py
```

## Related macro

`tools/blender-addon/holoflow_macros/curve_from_json.py` reads cable-route
JSON exported from the Three.js Holoflow spatial editor and calls the same
data API to reconstruct Bézier curves in Blender.

## External references

- Blender Foundation — bpy.types.Curve API — CC-BY-SA
  https://docs.blender.org/api/current/bpy.types.Curve.html
- Robert Guetzkow — blender-python-examples — MIT
  https://github.com/robertguetzkow/blender-python-examples
