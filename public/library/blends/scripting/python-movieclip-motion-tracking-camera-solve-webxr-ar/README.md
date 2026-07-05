# Python `bpy.types.MovieClip` — Motion Tracking → Camera Solve → WebXR AR Overlay

**Blender 5.1 · CC0 · Scripting**

Programmatic motion-tracking pipeline: load footage, detect and track features,
solve camera, bake constraints to FCurves, export the camera path as GLB and JSON
for WebXR AR overlay alignment.

## What this produces

| File | Description |
|------|-------------|
| `blueprint.py` | Full pipeline script — load, track, solve, export |
| `record.py` | Turntable viewport render of the reconstructed scene |
| `solved_camera.glb` | Camera node with baked TRS animation (no mesh) |
| `camera_path.json` | `[{frame, t:[x,y,z], q:[x,y,z,w]}, …]` stream for WebXR |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the tutorial video |

## Quick start

1. Place your footage at `//footage/clip.mp4` next to the .blend file.
2. Open Blender 5.1, switch to the Scripting workspace.
3. Open `blueprint.py` in the text editor and press **Run Script**.
4. Check the system console for `[solve] RMS reprojection error: X.XXXX px`.
5. `solved_camera.glb` and `camera_path.json` appear next to the .blend.

## Key concepts

### `bpy.types.MovieClip`
Container for a footage file (or image sequence). Lives in `bpy.data.movieclips`.
Contains: `tracking` (features + solve), `camera` (lens model), `use_proxy` flag.

### `bpy.types.MovieTracking`
Houses all tracked objects. `tracking.objects["Camera"]` is the default object
that the solve writes into. `tracking.tracks` is the list of `MovieTrackingTrack`.

### Context override for clip operators
`bpy.ops.clip.*` assert `context.area.type == "CLIP_EDITOR"` before running.
The `_clip_ctx()` helper repurposes an area temporarily so operator calls from
the Scripting workspace do not raise `RuntimeError: Operator bpy.ops.clip.* poll failed`.

### Baking constraints
`setup_tracking_scene()` creates a camera bound by a **Camera Solver** constraint.
GLB export ignores constraint-driven channels — `nla.bake(visual_keying=True,
clear_constraints=True)` bakes the evaluated world-space transform to plain FCurves
and removes the constraint so the exporter writes the keys.

### WebXR use of `camera_path.json`
```js
// Three.js — replay solved camera path in XR
const path = await fetch('/library/camera_path.json').then(r => r.json());
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const f = Math.round(clock.getElapsedTime() * 30) + 1;
  const entry = path.find(e => e.frame === f);
  if (entry) {
    camera.position.set(...entry.t);           // Blender +Y up
    camera.quaternion.set(...entry.q);         // [x,y,z,w]
  }
  renderer.render(scene, camera);
});
```

## Licence
CC0 — Holoflow Studio. Outside sources credited in the full tutorial at
`/tutorials/blender-tutorial-python-movieclip-motion-tracking-camera-solve-webxr-ar`.
