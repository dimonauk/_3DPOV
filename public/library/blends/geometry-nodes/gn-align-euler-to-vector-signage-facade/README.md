# GN Align Euler to Vector — Normal-Aligned Panel Instances on a Curved Façade
**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

Distributes flat sign panels on a 16-sided cylindrical building. Each panel
rotates automatically so its front face aligns to the outward face normal,
keeping all panels upright regardless of which side of the building they sit on.

The key node is `FunctionNodeAlignEulerToVector`. The critical parameters are
`axis` (which local arm to aim) and `pivot_axis` (which axis controls roll).

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — creates façade, panel, GN tree, materials, exports GLB |
| `record.py` | Animates the Factor socket for viewport.mp4 with camera orbit |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Generated artefacts (run blueprint.py then record.py)

- `signage_facade.blend`
- `signage_facade.glb` — façade + realised panel instances, Draco 6, WebP
- `public/library/videos/geometry-nodes/gn-align-euler-to-vector-signage-facade/viewport.mp4`
- `public/library/videos/geometry-nodes/gn-align-euler-to-vector-signage-facade/screen.mp4`

---

## Quick run

```bash
blender --background --python blueprint.py
blender --background signage_facade.blend --python record.py
```

## Key node — `FunctionNodeAlignEulerToVector`

```
axis        = 'Y'     # LOCAL +Y points toward face normal (panel faces outward)
pivot_axis  = 'Z'     # roll around world +Z to keep panels upright
inputs[0]   Rotation  # starting Euler (zero = identity)
inputs[1]   Factor    # 0=no effect, 1=full snap; animate for reveal
inputs[2]   Vector    # target direction (face normal)
outputs[0]  Rotation  # aligned Euler → Instance on Points.Rotation
```

## When to use which axis

| Goal | axis | pivot_axis | Notes |
|------|------|-----------|-------|
| Object stands perpendicular to surface | Z | AUTO | Rocks, trees on terrain |
| Object faces outward (wall panel/sign) | Y | Z | Vertical surfaces only |
| Object lies flat ON the surface | Z then +Rotate | AUTO | Decals, footprints |
| Object aligns along a surface edge | X | Y | Cables, seam strips |

## Licence
CC0 — no rights reserved. Do whatever you like with the blueprint code.
