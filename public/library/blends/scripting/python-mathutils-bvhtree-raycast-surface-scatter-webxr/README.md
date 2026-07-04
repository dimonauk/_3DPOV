# Python mathutils.BVHTree — Ray-Cast Surface Scatter & Collision Proxy (Blender 5.1)

Builds an accelerated BVH tree from an evaluated mesh (modifier stack applied),
fires inward rays from a Fibonacci-spiral hemisphere, aligns small props at each
hit normal, then derives a convex-hull collision proxy from the hit-point cloud for
WebXR hit-testing.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scatter script — run from Blender Text Editor |
| `record.py` | Viewport-animation recorder — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS screen-capture instructions |
| `.expected-artefacts.json` | Artefact manifest + cross-reference map |

## Outputs

| Artefact | Description |
|----------|-------------|
| `scatter_result.glb` | Displaced sphere + all oriented prop instances (Draco L6) |
| `collision_proxy.glb` | Single convex-hull mesh — use as WebXR hit-test target |

## Run

1. Open Blender 5.1, new General file.
2. Open `blueprint.py` in the Text Editor (Shift+F11).
3. **Save your `.blend` first** — the `//` export paths resolve relative to it.
4. Press **Run Script** (Alt + P).  Check the console for the hit-count line.
5. Two GLBs land beside the `.blend`: `scatter_result.glb` + `collision_proxy.glb`.
6. To record the reveal animation, run `record.py` immediately after (same session).

## Key concepts

| Concept | Note |
|---------|------|
| `BVHTree.FromObject(obj, depsgraph)` | Evaluated geometry — modifiers applied. `depsgraph` cannot be `None` in 5.1. |
| `bvh.ray_cast(origin, direction)` | Returns `(location, normal, index, distance)` — all `None` on miss. |
| `Vector.rotation_difference(other)` | Quaternion-based normal alignment; handles `normal ≈ −Z` without NaN. |
| `bmesh.ops.convex_hull(bm, input=verts)` | Minimal convex volume from point cloud — fast WebXR collision proxy. |

## Blender 5.1 notes

- `mathutils.bvhtree` lives in the `mathutils` C extension, not `bpy`; always
  available in Python-enabled builds.
- `BVHTree.FromBMesh()` operates on raw mesh data with no modifier evaluation —
  use it when you explicitly want pre-modifier geometry.
- `BVHTree.FromObject()` with a GN-deformed target uses the fully evaluated
  output geometry; the Depsgraph update is handled automatically.
- `bmesh.ops.convex_hull` was added in 2.73 and is unchanged through 5.1.

## Licence

CC0 — public domain.
