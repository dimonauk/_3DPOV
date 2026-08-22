# Python bpy.types.RigidBodyObject — Scripted Physics Scene & Trajectory JSON for WebXR

**Blender version**: 5.1  
**Licence**: CC0  
**Topic**: scripting  
**Slug**: python-rigid-body-physics-bake-trajectory-webxr

---

## What this entry covers

Blender's Bullet rigid-body engine is usually driven through the Physics Properties
panel. This entry shows the full Python path: building a `RigidBodyWorld`, adding
`ACTIVE` and `PASSIVE` bodies with correctly-chosen collision shapes, and capturing
the simulated trajectories by **frame stepping** — iterating `scene.frame_set(n)` +
`view_layer.update()` rather than using `bpy.ops.ptcache.bake_all()` (which polls
for a PROPERTIES context unavailable in headless scripts).

The output is a `trajectory.json` with per-frame `position` and `quaternion` in
GLTF coordinate space (+Y up), ready for use as a Three.js `AnimationClip` that
replays Blender physics in WebXR without the Bullet runtime.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full expert script — world setup, box stack, sphere projectile, frame stepping, JSON + GLB export |
| `record.py` | Viewport render animation — 3-second collision clip |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `rigid_bodies_scene.glb` | Static rest-pose geometry (generated on run) |
| `trajectory.json` | Per-frame transforms for ACTIVE bodies in GLTF space (generated on run) |

---

## Key expert notes

- `bpy.ops.rigidbody.world_add()` polls only `context.scene.rigidbody_world is None` — works without a 3-D View context.
- `bpy.ops.rigidbody.object_add()` requires `context.selected_objects` — always use `temp_override(selected_objects=[obj], active_object=obj)`.
- Physics evaluates **forward only**: jump to frame 60 without stepping 1–59 → stale zero matrix.
- Coordinate remap: Blender (X, Y, Z → right, forward, up) → GLTF (X, Y, Z → right, up, -forward): `gltf_pos = (bl_x, bl_z, -bl_y)`.
- Initial velocity via keyframes at frames 1 and 2 — `bpy.types.RigidBodyObject` has no `initial_velocity` attribute in 5.1.
- `collision_shape = 'BOX'` for rectangular objects: analytic GJK vs `MESH`'s O(n_tris) test, identical results.

---

## Related tutorials

- [Python Depsgraph — Evaluated Geometry & Batch GLB Export](/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export)
- [Python FCurve API — Procedural Keyframe Authoring](/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable)
- [Python Context temp_override — Mesh Repair Pipeline](/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline)
- [Physics: Rigid Body Constraints — Hinge, Spring & Motor (UI)](/tutorials/blender-tutorial-physics-rigid-body-constraints-hinge-spring-motor)

---

## Outside sources

- Blender Foundation, `bpy.types.RigidBodyObject` API, CC-BY-SA-4.0 — https://docs.blender.org/api/5.1/bpy.types.RigidBodyObject.html
- Blender Foundation, Rigid Body Simulation Manual, CC-BY-SA-4.0 — https://docs.blender.org/manual/en/5.1/physics/rigid_body/introduction.html
- mrdoob/three.js, AnimationClip + VectorKeyframeTrack, MIT — https://github.com/mrdoob/three.js
