# Screen Recording Notes — Mandelbulb Power-8

For `screen.mp4` capture alongside the automated `viewport.mp4`.

## OBS / Windows Game Bar settings

| Setting          | Value                              |
|------------------|------------------------------------|
| Capture source   | Window capture → **Blender**       |
| Resolution       | 1920 × 1080                        |
| Frame rate       | 30 fps                             |
| Audio            | **Off** (no narration for this one)|
| Output format    | MP4 (H.264)                        |
| CRF / quality    | 20 (high quality)                  |

## What to record

1. **Open** the `.blend` file saved by `blueprint.py`.
2. In the Script Editor, open `blueprint.py`. Scroll slowly so the camera
   catches the `de_batch` function and the `scan_surface` loop — pause 3 s
   on each.
3. **Run** the script. Watch the fractal appear in the 3D viewport.
4. In the viewport, press `Numpad 5` (orthographic off), then orbit slowly
   around the object for ~20 s using middle-mouse drag.
5. Open the **Shape Keys** panel (Properties → Object Data → Shape Keys).
   Set SK_Power6 to 1.0 and back to 0.0, then SK_Power4 to 1.0 — show the
   morph.
6. Open the **Vertex Colour** attribute panel and confirm `Mandelbulb_Depth`
   is listed as a FLOAT_COLOR POINT attribute.
7. In Viewport Shading, switch to **Material Preview** to show the
   cobalt → amber emission gradient.
8. Stop recording.

## Target duration

8–12 minutes total. Trim head/tail silence. No transitions needed.

## Destination

```
public/library/videos/scripting/
  python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr/
    screen.mp4
```
