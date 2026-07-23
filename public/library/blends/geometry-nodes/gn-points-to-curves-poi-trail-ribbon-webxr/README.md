# GN Points to Curves — Poi Trail & Particle Streak Ribbons

**Blender 5.1 · CC0 · Holoflow Studio**

## What this is

A production blueprint that converts five sets of orbital sample points into
smooth ribbon strands using `GeometryNodePointsToCurves`, then sweeps each
strand through a circular profile with `GeometryNodeCurveToMesh`.  The result
is five colour-gradient poi-orbit ribbons exported as a single Draco-compressed
GLB for WebXR.

## The key node: Points to Curves

`Points to Curves` groups POINT-domain input by a per-point INT attribute
(`curve_group`) and connects consecutive same-group points into POLY splines.
Order within a group is determined by ascending point index.  Points without
a matching group are emitted from the "Points" output socket.

```
Input:           Output:
  5 × 20 pts   →  5 × POLY splines (20 CV each)
  curve_group      one spline per unique group ID
  INT attribute
```

## Modifier stack (GN tree)

```
GroupInput (Geometry = point cloud mesh)
    ↓
PointsToCurves(Curve Group ID = curve_group INT)
    ↓
ResampleCurve(Count=64)          ← uniform arc-length spacing
    ↓
SetSplineCyclic(True)            ← closed orbit loops
    ↓
StoreNamedAttribute('strand_factor', SplineParameter.Factor)
    ↓
CurveToMesh(Profile=Circle r=0.018 m, 8 sides, Fill Caps=True)
    ↓
SetShadeSmooth(False)            ← flat-shaded facets
    ↓
GroupOutput
```

## Generated artefacts

| File | Description |
|------|-------------|
| `hf_poi_trails.blend` | Live scene with GN modifier + point cloud |
| `hf_poi_trails.glb` | Draco-6, +Y up, 5 ribbons + `strand_factor` accessor |

## Key parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| `N_ORBITS` | 5 | Number of distinct poi orbit strands |
| `N_STEPS` | 20 | Control-point count per orbit (before resampling) |
| `RIBBON_RADIUS` | 0.018 m | Tube cross-section radius |
| `RESAMPLE_COUNT` | 64 | Vertices per strand after arc-length resampling |
| `ORBIT_RADII` | 0.6–1.8 m | XY orbit radii per strand |

## Gotchas

- **Group ID must be INT, not FLOAT.** FloatToInt casting can yield duplicate
  values. Use `RandomValue(INT)` or index arithmetic.
- **Resample before SetSplineType.** POLY→NURBS on non-uniform point spacing
  produces kinks. Resample first ensures even knot distribution.
- **Cyclic after Resample**, not before. Resampling a cyclic curve samples
  the gap segment too, shifting the gradient by one segment width.

## Tutorial

`/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr`

## Licence

CC0 — no rights reserved.
