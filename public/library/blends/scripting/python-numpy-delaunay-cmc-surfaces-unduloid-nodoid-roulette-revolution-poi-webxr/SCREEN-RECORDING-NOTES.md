# Screen Recording Notes — Delaunay CMC Surfaces (OBS / Game Bar)

## Target file
`public/library/videos/scripting/python-numpy-delaunay-cmc-surfaces-unduloid-nodoid-roulette-revolution-poi-webxr/screen.mp4`

## OBS settings

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone) |
| Output format | MP4 |
| Encoder | x264 or GPU (H.264) |
| CRF / Quality | 23 (good balance) |

## What to record (in order)

1. **Script pane** (20 s) — show `blueprint.py` open in Blender's Scripting workspace, scroll through the ODE integrator and shape key loop so the code is legible.

2. **Run the script** (10 s) — click ▶ Run Script; show the console output as the mesh appears in the 3D viewport.

3. **3D Viewport** (30 s) — switch to Material Preview (Z → Material Preview). Orbit slowly around the unduloid poi head showing the smooth revolution and vertex colour gradient.

4. **Shape key scrubber** (20 s) — open Properties → Object Data → Shape Keys. Scrub the `sphere` key value from 0 → 1 → 0 slowly so the viewer sees the unduloid bloat into a sphere and return.

5. **Shape key: nodoid** (15 s) — scrub the `nodoid` key 0 → 1, showing the self-intersecting bulge characteristic.

6. **GLTF export dialog** (10 s) — open File → Export → glTF 2.0, show the Draco compression and WebP texture settings.

## Timing

Total screen.mp4 duration: **≈ 1 min 45 s**

## Windows Game Bar alternative

Press `Win + G` → Capture → Start Recording. Set to capture Blender window only. Output lands in `%USERPROFILE%\Videos\Captures\` — move it to the target path above.

## Notes

- Shade Flat is set in the script; Material Preview should already show faceted shading.
- The teal-to-bright vertex colour gradient is visible in Material Preview with Colour Attribute enabled.
- If the GLB export dialog is greyed out, ensure `io_scene_gltf2` extension is enabled in Edit → Preferences → Extensions.
