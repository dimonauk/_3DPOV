# GN Curve Tangent + Curve Normal — Frenet-Serret Frame Ribbon Beam

**Blender 5.1 · Geometry Nodes · CC0**

A sinuous energy beam trail built by sweeping a circle profile along a Bezier
S-curve. The Frenet-Serret orthonormal frame — T (tangent), N (normal),
B (binormal) — is stored as per-vertex named attributes on the exported GLB,
enabling advanced anisotropic shaders in Three.js/R3F.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene builder + GN tree + GLB export |
| `record.py` | EEVEE-Next orbit render → `viewport.mp4` (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `output/energy_beam.glb` | Exported result (run blueprint to generate) |

## Technique summary

```
ResampleCurve(64)
 ├─ CurveTangent ──────────────────────────────→ StoreNamedAttribute("_T")
 ├─ CurveNormal(MINIMUM_ROTATION) ────────────→ StoreNamedAttribute("_N")
 ├─ VectorMath(CROSS, T, N) ──────────────────→ StoreNamedAttribute("_B")
 ├─ SplineParameter.Factor ───────────────────→ StoreNamedAttribute("beam_t")
 └─ CurveToMesh(profile=CurveCircle(r=0.042, 8pts))
     └─ SetPosition(+NoiseOffset) → SetShadeSmooth → output
```

## Custom GLB attributes

| Name | Domain | Type | Use in Three.js |
|---|---|---|---|
| `_T` | POINT | FLOAT_VECTOR | Anisotropic highlight axis (sheen direction) |
| `_N` | POINT | FLOAT_VECTOR | Bend gradient (glow fades to convex side) |
| `_B` | POINT | FLOAT_VECTOR | Lateral distortion axis for plasma effects |
| `beam_t` | POINT | FLOAT | 0→1 position along beam (for alpha fade shader) |

## Key insight: field source vs realised output

`CurveTangent` is a lazy field — it evaluates once per consumer call with no
intermediate buffer. `CurveToPoints.Tangent` realises the same vector but forces
the full CurveToPoints operation first. Use `CurveTangent` when you need the
vector as data; save `CurveToPoints` for when you are already using it to place
instances.

## Blender version

Tested on Blender 5.1. `CurveNormal.mode = 'MINIMUM_ROTATION'` was added in
Blender 3.4; `GeometryNodeSetShadeSmooth` with a `domain` property requires 4.1+.

## Licence

CC0 1.0 Universal — no rights reserved. Attribution appreciated but not required.
