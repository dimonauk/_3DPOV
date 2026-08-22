# Screen Recording Notes — Cycles Long-Exposure Accumulation

Target file: `public/library/videos/scripting/python-bpy-cycles-long-exposure-render-loop-numpy-exr-max-fold-light-trail/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (full application) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |

## Session to record

1. **Open Blender 5.1.** New general file.
2. **Switch to Scripting workspace** (top bar).
3. **Open blueprint.py** in the Text Editor panel.
4. Hit **▶ Run Script**. Show the helix scene appearing in the viewport.
5. **Open the Python Console** (split panel or operator search `Python Console`).
6. Switch the 3D Viewport to **Material Preview** (Z → Material Preview shading) so the
   emissive orange and cyan tubes glow in the viewport.
7. Orbit the viewport manually around the helix for 10 seconds to show the 3D form.
8. In the Python Console, type:
   ```python
   build_long_exposure()
   ```
   Let it run. Show the console output counting subframes.
9. When complete, open the **UV Editor** or **Image Editor** panel and load
   `hf_longexp_composite.png` to show the final accumulated image.
10. Zoom in on the composite: show how both orange and cyan strands appear
    from all orbit angles in one image.

## Key moments to capture

- The double helix appearing in the viewport (frames 0–5 s)
- The `build_long_exposure()` call and the console counting 1/60 … 60/60
- The final composite image: all helix views collapsed into one long-exposure frame
- Side-by-side viewport (3D helix) + Image Editor (2D composite) if screen space allows

## Rough timing

| Section | Duration |
|---|---|
| Script open + run | 0:00 – 0:30 |
| Viewport orbit demo | 0:30 – 0:50 |
| `build_long_exposure()` running (speed-up in edit if needed) | 0:50 – 2:00 |
| Composite reveal | 2:00 – 2:30 |
| Total | ≈ 2:30 |

## Tips

- Set Viewport shading to **Material Preview** or **Rendered** before recording.
- If `build_long_exposure()` is too slow to record in real-time, set `N_SUBFRAMES = 8`
  in blueprint.py for a fast demo (8 × 45° orbit steps), then cut to the full 60-frame
  result image in post.
- Close all other applications to keep Blender responsive during the render loop.
