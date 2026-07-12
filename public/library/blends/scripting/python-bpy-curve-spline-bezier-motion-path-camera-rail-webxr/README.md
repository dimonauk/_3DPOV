# Python bpy.types.Curve + BezierSpline — Motion-Path Camera Rail & Cinematic Fly-Through GLB (Blender 5.1)

**Slug:** `python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr`
**Topic:** scripting · **Licence:** CC0 · **Blender:** 5.1

---

## What this builds

An oval Bezier camera rail constructed entirely in Python, with a camera that
follows the path via the `FOLLOW_PATH` constraint and always looks at a central
look-at empty via `TRACK_TO`. Both constraints are baked to explicit
`location` / `rotation_euler` keyframes before GLB export so the camera
animation plays correctly in Three.js / Babylon.js / WebXR runtimes.

### Output files

| File | Description |
|------|-------------|
| `holoflow_cam_rail.glb` | Camera + torus prop, 120-frame animation |
| `holoflow_cam_rail.blend` | Full scene with rail, constraints, action |
| `blueprint.py` | Reproducible build script |
| `record.py` | Automated viewport render |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen capture |

---

## Key techniques

| Technique | API surface |
|-----------|-------------|
| Bezier curve data block | `bpy.data.curves.new(type='CURVE')` |
| Spline control | `curve.splines.new('BEZIER')`, `sp.bezier_points.add(N)` |
| Handle types | `bp.handle_left_type ∈ {VECTOR, AUTO, ALIGNED, FREE}` |
| Camera follow rail | `FOLLOW_PATH` constraint, `offset_factor` animation |
| Camera look-at | `TRACK_TO` constraint |
| Constraint bake | `bpy.ops.nla.bake(visual_keying=True, clear_constraints=True)` |
| Headless operator | `bpy.context.temp_override()` |
| Camera GLB export | `export_cameras=True`, `export_animation_mode='ACTIONS'` |

---

## Key pitfalls

- `sp.bezier_points.add(N)` adds N points to the **existing** 1 — call
  `.add(3)` not `.add(4)` to reach 4 total control points.
- `handle_left_type` must be set **before** writing `handle_left` / `handle_right`
  positions; setting type afterwards recalculates handle positions, overwriting
  your values.
- `cu.use_path = True` is required for `FOLLOW_PATH` to evaluate position along
  the curve; omitting it causes the camera to sit at the curve origin.
- `FOLLOW_PATH.use_fixed_location = True` is needed to animate via
  `offset_factor`; the default `False` uses a frame-offset system instead.
- After `nla.bake(clear_constraints=True)`, the constraint list is empty —
  verify in the Properties panel before export.
- `export_animation_mode='ACTIONS'` exports all named actions; use
  `'ACTIVE_ACTIONS'` to restrict to the one active per object.

---

## Usage in WebXR (Three.js)

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('holoflow_cam_rail.glb', (gltf) => {
  // The exported camera is a THREE.PerspectiveCamera inside gltf.cameras
  const cam = gltf.cameras[0];
  scene.add(gltf.scene);  // includes the torus prop

  // AnimationClip named after the baked action
  const mixer = new THREE.AnimationMixer(gltf.scene);
  gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  // Call mixer.update(delta) in your render loop
});
```

---

## Cross-references

- [Camera data tutorial](/tutorials/blender-tutorial-python-bpy-camera-data-webxr-frustum-fov-calibration)
- [Object constraint bake tutorial](/tutorials/blender-tutorial-python-object-constraint-stack-lookat-floor-bake-webxr)
- [Context override tutorial](/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting)
- [NLA track / action library tutorial](/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend)

---

## Outside sources

- [bpy.types.Curve API — Blender Foundation, CC-BY-SA-4.0](https://docs.blender.org/api/5.1/bpy.types.Curve.html)
- [Follow Path Constraint — Blender Manual, CC-BY-SA-4.0](https://docs.blender.org/manual/en/latest/animation/constraints/relationship/follow_path.html)
- [Blender source — projects.blender.org](https://projects.blender.org/blender/blender)
