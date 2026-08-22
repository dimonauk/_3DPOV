# Screen Recording Notes — python-bpy-volume-openvdb-domain-field-sample-webxr

## Software
OBS Studio 30+ or Windows Game Bar (Win + G).

## Source
Window Capture → select **Blender 5.1** window.
Resolution: **1920 × 1080**.  Framerate: **30 fps**.  Audio: **off**.

## Output path
`public/library/blends/scripting/python-bpy-volume-openvdb-domain-field-sample-webxr/screen.mp4`
Codec: H.264 · CRF 23 · MP4 container.

## Steps to record (target ≤ 90 s)

1. Open Blender 5.1.  File → Save As →
   `public/library/blends/scripting/python-bpy-volume-openvdb-domain-field-sample-webxr/density_cloud.blend`.

2. Open the **Scripting** workspace.  Paste `blueprint.py` into the Text Editor.

3. **Start OBS recording.**

4. Click **Run Script** (or Alt + P).  Let the console log scroll:
   `VDB → /tmp/holoflow_density.vdb  (N active voxels)`
   `N sample points above threshold 0.25`
   `GLB → .../density_cloud.glb`
   The VDB generation loop takes 5–30 s depending on CPU — leave the camera
   on the console so viewers see the script working.

5. Switch to the **3D Viewport**.  Select `density_field`.
   Press **Z → Rendered** to preview volumetric scattering.
   Slowly rotate the view to show the two Gaussian blob shapes.

6. Press **Z → Solid**.  Select `density_cloud`.
   Press **Z → Material Preview** to show the blue→white density colour ramp.

7. Open the **Spreadsheet Editor** on `density_cloud` (point domain).
   Switch domain to **Face Corner** → show the `density_col` attribute.

8. Open `density_cloud.glb` in a second Blender window via
   File → Import → glTF 2.0 to confirm the exported mesh loads correctly.

9. **Stop OBS recording.**  Trim to ≤ 90 s.  Export 1920 × 1080, H.264, CRF 23.

## Notes
- `import pyopenvdb` works **only** inside Blender's bundled interpreter.
  Running `blueprint.py` with a system Python will fail on that import.
- If `/tmp/holoflow_density.vdb` already exists from a previous run,
  `build_vdb()` overwrites it — this is intentional.
- The volume object may appear invisible in Solid mode; switch to Rendered
  to confirm it loaded correctly.
