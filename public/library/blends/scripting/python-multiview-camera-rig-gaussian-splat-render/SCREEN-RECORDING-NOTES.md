# Screen Recording Notes — Multi-View Camera Rig for Gaussian Splatting

**Target file:** `public/library/videos/scripting/python-multiview-camera-rig-gaussian-splat-render/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary needed for library archive) |
| Format | MP4 / H.264 |

## What to record

1. **Scene overview** (5 s): open `output.blend`, orbit around to show the full
   Fibonacci shell of 64 cameras surrounding the icosphere.
2. **Spreadsheet / Python console** (10 s): show `fibonacci_sphere_positions`
   output in the console — paste snippet, print first 5 positions.
3. **Single render** (15 s): set `N_VIEWS = 4`, run script, watch 4 views render
   in the UV/Image Editor as they complete.
4. **transforms.json preview** (10 s): open `output/transforms.json` in a text
   editor overlay; scroll to show the `transform_matrix` block for frame 0.
5. **nerfstudio terminal** (10 s): if nerfstudio is installed, show
   `ns-train splatfacto --data output/` starting in the terminal.

## Tips

- Set `N_VIEWS = 4` and `RENDER_SAMPLES = 4` during recording to keep render
  time short; the audience understands it scales to 64.
- Use the Viewport Shading → Rendered mode (EEVEE) so viewers can see the
  three-point lighting at work without waiting for Cycles.
- The camera frustum overlays (Viewport Overlays → Extras → Camera) make the
  64-camera shell clearly visible in the 3D viewport.
