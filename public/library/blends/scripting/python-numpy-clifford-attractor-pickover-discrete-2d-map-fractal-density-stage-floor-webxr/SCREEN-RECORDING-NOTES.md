# Screen Recording Notes — Clifford Attractor

**Target file:** `public/library/videos/scripting/python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr/screen.mp4`

## OBS Studio setup (preferred)

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264, CRF 18) |

## What to record

1. **Open** Blender 5.1, load or build the scene with `blueprint.py`.
2. **Script run** — show the Scripting workspace, paste blueprint.py, click Run.
   Hold for the 20–40 s compute; the terminal printout confirms progress.
3. **Result reveal** — switch to 3D Viewport, numpad `7` (top-down), zoom out to
   see the full floor (Basis shape, starfish pattern).
4. **Shape key sweep** — open Properties → Object Data → Shape Keys panel.
   Manually drag SK_Cave, SK_Web, SK_Sparse values 0 → 1 → 0 in sequence,
   pausing ~3 s on each so viewers can read the parameter differences.
5. **Vertex colour** — in Viewport Shading, switch to Solid with Colour = Attribute
   and select "Clifford_Z" to show the cobalt-to-amber gradient.
6. **Orbit camera** — press `MMB` drag or numpad `4`/`6` to orbit around the mesh
   at low angle (~20° elevation) to show height relief.
7. **GLB export** (optional) — File → Export → glTF, show export dialogue.

## Windows Game Bar (`Win + G`)

1. `Win + G` → Start Recording
2. Perform steps 1–6 above
3. `Win + G` → Stop Recording
4. Rename saved clip to `screen.mp4` and place in target folder

## Duration target

8–12 minutes for a full tutorial walkthrough. Trim dead time in a video editor;
jump cuts at compute-wait points are fine.
