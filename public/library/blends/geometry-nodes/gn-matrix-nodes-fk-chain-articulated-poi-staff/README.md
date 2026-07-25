# GN Matrix Nodes — FK Chain: Articulated Poi Staff (Blender 5.1)

Blender 5.x introduces 4×4 Matrix nodes to Geometry Nodes — `Combine Matrix`,
`Multiply Matrices`, `Decompose Matrix`, `Transform Point`, `Transform Direction`.
This library entry builds an 8-segment articulated poi staff using a Repeat Zone
to accumulate a forward-kinematics chain: each iteration multiplies the running
`accum_M` by a `local_M` encoding the next joint's rotation and translation.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full GN tree build + FK chain logic |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output manifest |

## Expected outputs

- `hf_poi_staff.blend` — saved after running blueprint.py + manual review
- `hf_poi_staff.glb` — exported via Holoflow GLB export pipeline

## Blender version

Blender 5.1 minimum. The `Matrix` socket type on Repeat Zone items and the
`GeometryNodeCombineMatrix`, `GeometryNodeMultiplyMatrices`,
`GeometryNodeDecomposeMatrix`, `GeometryNodeTransformPoint` node types
**do not exist in Blender 4.x or earlier**. Running this blueprint on Blender
4.x will fail with `RuntimeError: bpy.data.node_groups...`.

## Technique

```
anchor point → Repeat Zone (NUM_SEGS iterations)
  accum_M[0] = identity matrix
  For each iteration i:
    joint_angle = JOINT_ANGLE + noise(i) × NOISE_SCALE
    local_M  = Combine Matrix(T=(0, SEG_LENGTH, 0), R=Euler(joint_angle, 0, 0))
    accum_M  = Multiply Matrices(accum_M, local_M)
    tip_pos  = Transform Point((0,0,0), accum_M)
    joints  += single point at tip_pos with joint_rot attribute
→ Mesh Line resampled to joint positions via SampleIndex
→ Curve To Mesh with hexagonal profile (TUBE_VERTS=6, TUBE_RADIUS=0.035 m)
→ Icosphere knuckle instances at each joint (KNUCKLE_R=0.055 m)
→ seg_t attribute (0..1) → indigo→amber emission colour ramp
```

## Parameters

| Name | Default | Effect |
|------|---------|--------|
| NUM_SEGS | 8 | Number of chain links |
| SEG_LENGTH | 0.28 m | Metres per segment |
| JOINT_ANGLE | 0.30 rad | Base rest angle per joint |
| NOISE_SCALE | 0.55 | Per-joint angle variation |
| TUBE_VERTS | 6 | Hexagonal tube cross-section |
| TUBE_RADIUS | 0.035 m | Segment cylinder radius |
| KNUCKLE_R | 0.055 m | Joint sphere radius |

## Licence

CC0 — Holoflow Studio. Outside references credited in `blueprint.py` header.
