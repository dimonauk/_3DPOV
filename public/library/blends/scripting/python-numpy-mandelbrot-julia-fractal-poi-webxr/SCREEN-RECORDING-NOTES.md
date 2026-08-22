# Screen Recording Notes — Mandelbrot & Julia Fractal

**Target file**: `public/library/videos/scripting/python-numpy-mandelbrot-julia-fractal-poi-webxr/screen.mp4`

## OBS / Xbox Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (tutorial narration added in post) |
| Format | MP4 / H.264 CRF 23 |

## What to record

1. **Script run** (30 s): Show Scripting workspace. Click ▶ Run Script on blueprint.py. Camera
   stays on the terminal output — watch "Computing Mandelbrot smooth escape count …" then
   "✓ hf_mandelbrot.glb written".

2. **Result inspect** (45 s): Switch to 3D Viewport. Toggle Material Preview (Z).  Pan around
   the Mandelbrot relief mesh — the deep black interior, the blue-to-gold boundary fringe, the
   Julia mesh beside it. Zoom into the Douady-rabbit ear to show the self-similar filaments.

3. **Boundary curve** (20 s): Select the NURBS Curve object (hf_boundary_poi_path) in the
   Outliner. Show it highlighted in orange — this is the poi trajectory.

4. **Record.py run** (10 s): Open record.py, click ▶ Run Script, then trigger
   Render > Render Animation (Ctrl+F12). Show the first few frames rendering in the
   Info header.

## Edit cues

- Cut between Script→Viewport at the "✓ written" terminal line.
- Slow-mo (0.5×) the zoom into the rabbit-ear filaments.
- Colour-grade: lift shadows slightly to show interior facets; desaturate slightly for
  the "cold light" look consistent with other tutorials in this series.
