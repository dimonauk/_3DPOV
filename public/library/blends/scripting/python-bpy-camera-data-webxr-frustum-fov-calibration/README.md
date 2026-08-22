# Python bpy.types.Camera — Sensor Intrinsics, Off-Axis Shift & WebXR Frustum Calibration

**Blender 5.1 | CC0 | Holoflow Studio**

## What this teaches

Blender's camera is defined entirely by four numbers — focal length, sensor size, clip
planes, and optional shift — yet those four numbers encode the full optical geometry of
the frustum.  This blueprint exposes every property on `bpy.types.Camera`, shows how to
compute the matching OpenGL projection matrix in Python, and exports a
`camera_intrinsics.json` sidecar that a Three.js / WebXR runtime can consume directly.

Key skills covered:

- Creating a Camera data block with `bpy.data.cameras.new()` (no operator context required)
- `cam.lens`, `cam.sensor_width`, `cam.sensor_height`, `cam.sensor_fit`
- FoV formula: `2 · arctan(sensor_dim / (2 · focal_mm))`
- Off-axis frustum via `cam.shift_x / cam.shift_y` (fraction of sensor dimension)
- Depth of field: `cam.dof.use_dof`, `cam.dof.aperture_fstop`, `cam.dof.focus_distance`
- Computing the OpenGL projection matrix from Blender intrinsics
- Reconciling Blender (Z-up) with WebXR / Three.js (Y-up right-handed)
- Exporting the camera inside a GLB and reading it back in Three.js

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main script — builds scene, configures camera, emits JSON + GLB |
| `record.py` | Renders 72-frame orbit animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

Open Blender 5.1 → File → New → Scripting workspace.  Paste or open `blueprint.py`.
Ensure the `.blend` has been saved somewhere first (needed for relative `//` paths).
Press **Run Script**.

Expected console output:

```
[holoflow] FoV  H=90.00°  V=73.74°
[holoflow] Three.js snippet:  camera.fov = 73.74; camera.aspect = 1.3333; ...
[holoflow] intrinsics → /path/to/camera_intrinsics.json
[holoflow] GLB → /path/to/camera_orbit.glb
```

## WebXR consumption

```js
// Three.js
const camera = new THREE.PerspectiveCamera(73.74, 1.3333, 0.05, 500);
// Or parse from the JSON sidecar:
const { vfov_deg, hfov_deg, clip_near, clip_far } = intrinsics;
camera.fov    = vfov_deg;
camera.aspect = Math.tan(hfov_deg * Math.PI / 360) / Math.tan(vfov_deg * Math.PI / 360);
camera.near   = clip_near;
camera.far    = clip_far;
camera.updateProjectionMatrix();
```

## Sources

- Blender Foundation `bpy.types.Camera` API (CC-BY-4.0):
  <https://docs.blender.org/api/5.1/bpy.types.Camera.html>
- Three.js `PerspectiveCamera` (MIT, mrdoob):
  <https://github.com/mrdoob/three.js/blob/dev/src/cameras/PerspectiveCamera.js>
