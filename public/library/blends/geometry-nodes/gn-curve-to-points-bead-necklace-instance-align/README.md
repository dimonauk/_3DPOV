# GN Curve to Points — Parametric Bead Necklace

**Blender 5.1** | CC0 | Holoflow Studio

Converts a Bezier Circle into a parametric pearl necklace using
`GeometryNodeCurveToPoints` (COUNT mode) for uniform bead placement,
`FunctionNodeAlignEulerToVector` for tangent-aligned bead rotation,
and a parallel `GeometryNodeCurveToMesh` branch for the silk cord.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene constructor + GLB export |
| `record.py` | Viewport animation recorder (camera orbit) |

## Run order

```bash
blender --background --python blueprint.py   # builds scene, exports GLB
blender bead_necklace.blend --python record.py  # records viewport.mp4
```

## Key node chain

```
Group Input (Geometry, Bead Count, Bead Radius, String Radius)
  │
  ├─[Bead branch]─────────────────────────────────────────────
  │  ResampleCurve (EVALUATED, 64)
  │  └─ CurveToPoints (COUNT, N)
  │       ├─ Points → InstanceOnPoints
  │       └─ Tangent → AlignEulerToVector (Y, pivot Z)
  │            └─ Rotation → InstanceOnPoints
  │  MeshUVSphere (8×6, Bead Radius)
  │       └─ Instance → InstanceOnPoints
  │  RandomValue (FLOAT, 0.75–1.25, seed 7)
  │  CombineXYZ (scalar → vec3) → InstanceOnPoints.Scale
  │  InstanceOnPoints → SetMaterial(Pearl) → RealizeInstances
  │
  └─[String branch]───────────────────────────────────────────
     ResampleCurve (EVALUATED, 64)
     └─ CurveToMesh + CurvePrimitiveCircle (6 verts, String Radius)
          └─ SetMaterial(Cord)

JoinGeometry → Group Output
```

## Parameters (modifier panel)

| Socket | Default | Range | Effect |
|--------|---------|-------|--------|
| Bead Count | 40 | 4–200 | Number of beads |
| Bead Radius | 0.08 | 0.01–0.50 | Pearl radius in BU |
| String Radius | 0.005 | 0.001–0.05 | Cord thickness |

## Output GLB

- `bead_necklace.glb` — two-material mesh: pearl beads + cord
- Draco level 6 compression
- Y-up, WebXR-ready
- `export_apply=True` required (GN modifier is lazy-evaluated)

## Tutorial

`/tutorials/blender-tutorial-gn-curve-to-points-bead-necklace-instance-align`
