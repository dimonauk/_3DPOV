# Screen Recording Notes — Catmull-Clark Subdivision from Scratch

Tutorial: `python-bmesh-catmull-clark-subdivision-from-scratch-valence-weight-poi-head-webxr`
Output file: `public/library/videos/scripting/python-bmesh-catmull-clark-subdivision-from-scratch-valence-weight-poi-head-webxr/screen.mp4`

---

## OBS Studio setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no commentary track needed) |
| Output format | MP4 (H.264 CRF 20) |

## Recommended Windows Game Bar shortcut

`Win + Alt + R` — start/stop recording the foreground app.

Set the capture region to the full Blender window including the header bar, so the version number `Blender 5.1.x` is visible.

---

## Scene progression to capture

| Time | What to show |
|------|-------------|
| 0 s | Open `blueprint.py` in Blender's Scripting workspace. Scroll to the `ROUNDS = 2` constant and pause so the viewer can read the algorithm comment block at the top of the file. |
| 15 s | Press **Run Script**. Switch to 3D Viewport (Solid shading). |
| 25 s | Pan/orbit around the orange face-point cloud and cyan edge-point cloud overlaid on the base polo-sphere. |
| 40 s | Select `PoiHead_CC2` — the subdivided result. Toggle to **Material Preview** (Z → Material Preview). Orbit to show the smooth surface. |
| 55 s | In a text editor, highlight the `catmull_clark_round()` function. Scroll slowly so the viewer sees the three stencil calculations: face points, edge points, vertex points. |
| 70 s | Open the **Modifier Properties** panel. Add a **Subdivision Surface** modifier to `PoiHead_Base` (set to level 2) and show that the shapes are visually identical — confirming the hand-written algorithm is correct. |
| 85 s | Switch to **Rendered** viewport shading. Let it render for 5 s showing the metallic chrome head. |
| 100 s | Stop recording. |

Total screen recording target: ~100 s.

---

## Notes

- Blender's own Subdivision Surface modifier uses OpenSubdiv (Pixar, Apache-2.0) under the hood. The point of this tutorial is to see all the maths unfold before letting Blender handle it in production.
- The orange face-point spheres and cyan edge-point spheres are created by `_debug_points()` in `blueprint.py` — they vanish after the first round because `SHOW_*` flags only apply to round 1.
- If the viewport looks blank after Run Script, press `Numpad .` to frame selected objects.
