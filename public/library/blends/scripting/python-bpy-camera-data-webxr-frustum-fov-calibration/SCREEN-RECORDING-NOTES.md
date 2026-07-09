# Screen Recording Notes — Camera Intrinsics & WebXR Frustum Calibration

## Setup

| Setting | Value |
|---------|-------|
| Software | OBS Studio ≥ 30 or Windows Game Bar (Win+G) |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic / system audio needed) |
| Output | `screen.mp4` → `public/library/videos/scripting/python-bpy-camera-data-webxr-frustum-fov-calibration/` |

## What to capture (in order)

1. **Scripting workspace** open with `blueprint.py` contents visible.
2. Scroll through the named-constants block — pause on `FOCAL_LENGTH_MM` and `SENSOR_FIT`.
3. Scroll to `blender_projection_matrix()` — read the docstring aloud or on-screen annotation.
4. Run the script (▶ Run Script).  Show the Info bar confirm and the console print:
   - `FoV  H=xx.xx°  V=xx.xx°`
   - `Three.js snippet: camera.fov = ...`
5. Switch to **3D Viewport**, look-through camera (`Numpad 0`).  The icosphere should be
   framed in the view.  Orbit timeline (Space) so the camera rotates 360°.
6. Open a **Text Editor** panel alongside; open `camera_intrinsics.json` and
   show the `projection_matrix` block.
7. Close with a **Properties → Object Data** panel showing the camera's lens, sensor,
   clip, and DOF values exactly matching the script constants.

## Suggested OBS scene

```
Sources:
  [Window Capture]  Blender 5.1
  [Text]            "bpy.types.Camera – Frustum Calibration"  (corner watermark)
Filters on Window Capture:
  Crop: none (capture full 1920×1080 Blender window)
```

## Encoding (OBS output settings)

- Encoder: x264 or NVENC H.264
- Rate control: CRF 18
- Keyframe interval: 2 s
- Profile: High
- Tune: Film

Target file size: under 80 MB for a 2–3 minute recording.
