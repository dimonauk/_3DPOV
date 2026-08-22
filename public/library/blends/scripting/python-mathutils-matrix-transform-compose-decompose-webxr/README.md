# Python mathutils.Matrix — Transform Composition, Decomposition & Coordinate-Space Conversion
**Blender 5.1 | Holoflow Studio Library | CC0**

## What this teaches

Every object in Blender lives inside a 4×4 column-major homogeneous matrix
(`matrix_world`).  Knowing how to compose, decompose, and convert these matrices
unlocks: precise headless object placement, gimbal-safe animation baking, orbit-
around-arbitrary-pivot rigs, and correct THREE.js import without manual axis flips.

## Technique summary

| Step | API used | Why it matters |
|------|----------|----------------|
| Compose TRS | `Matrix.Translation @ q.to_matrix().to_4x4() @ Matrix.Diagonal` | Avoids Euler gimbal lock entirely |
| Decompose   | `matrix_world.decompose()` → `(Vector, Quaternion, Vector)` | Stable at any rotation value |
| Pivot rotate | `T(P) @ R @ T(−P) @ ob.matrix_world` | Orbits around world point, not object origin |
| World ↔ local | `matrix_world.inverted() @ world_point` | Needed for attachment snapping in GN |
| THREE.js export | `BLENDER_TO_THREEJS @ mat`, then transpose → flatten | Handles both axis swap and column-major storage |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full demo: hub + 6 satellites + children, decompose round-trip, pivot rotate, JSON export |
| `record.py` | Viewport animation recording (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Artefact manifest for CI |

## Expected outputs

- `matrix_demo.blend` — the demo scene
- `matrix_manifest.json` — per-object `{ translation, rotation_quat, scale, matrix_threejs }` for every object
- `viewport.mp4` — rendered camera orbit + reveal animation (via record.py)
- `screen.mp4` — OBS screen recording (manual step)

## Outside sources

- **Blender Foundation** — [mathutils.Matrix API](https://docs.blender.org/api/5.1/mathutils.html#mathutils.Matrix)
  — [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); the official reference for `.decompose()`, `.to_4x4()`, and the `@` operator semantics.
- **Nikolai Janakiev** — [blender-scripting (MIT)](https://github.com/njanakiev/blender-scripting)
  — practical transform examples including orbit cameras; sibling org repos at [github.com/njanakiev](https://github.com/njanakiev).
- **THREE.js / mrdoob** — [Matrix4.fromArray docs (MIT)](https://threejs.org/docs/#api/en/math/Matrix4)
  — clarifies column-major storage order and the right-hand coordinate frame assumed by THREE.js Matrix4.

## Related Holoflow entries

- [FCurve keyframe authoring](/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable) — once objects are placed via matrix, keyframe their transforms via FCurves.
- [PoseBone IK bake](/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm) — the same `decompose() → keyframe_insert` baking pattern applied to armature bones.
- [Object constraint bake](/tutorials/blender-tutorial-python-object-constraint-stack-lookat-floor-bake-webxr) — reading `matrix_world` from `evaluated_get(depsgraph)` to capture constraint results.
- [mathutils.BVHTree ray-cast](/tutorials/blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr) — uses matrix transforms to place ray origins and convert hit normals.
- [Collection batch GLB export](/tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr) — transforms are preserved per-object in the exported GLB hierarchy.

## Licence

CC0 — place in the public domain.  No attribution required.
