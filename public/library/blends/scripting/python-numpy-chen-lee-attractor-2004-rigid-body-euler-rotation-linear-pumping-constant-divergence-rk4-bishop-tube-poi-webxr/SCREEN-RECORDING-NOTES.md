# Screen Recording Notes — Chen-Lee Attractor 2004

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop) |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` |

## What to capture

1. **Open Blender 5.1** — new General file.
2. **Open the Scripting workspace** — paste `blueprint.py` into the text editor.
3. **Run the script** (`Alt+P` or the ▶ button).  
   Four integration passes run sequentially (~30 s total on modern hardware);
   the Python console prints progress for each shape key.
4. **Switch to Layout workspace** — select `CL_Poi`.
5. **Rotate the viewport slowly** (middle-mouse drag) to reveal the four-lobe
   structure: the attractor spans two figure-eights rotated about a diagonal
   axis, reflecting the Z₂×Z₂ symmetry of the underlying equations.
6. **Open the Shape Key panel** (Properties → Object Data → Shape Keys):
   - Scrub `SK_LowA` 0 → 1 → 0: the orbit contracts as the x-pump weakens;
     near a=3 the system approaches a period-doubling cascade boundary.
   - Scrub `SK_HighC` 0 → 1 → 0: weak z-damping lets the orbit stretch along
     the z-axis; the four off-origin fixed points move toward ±7.8 in z.
   - Scrub `SK_WeakB` 0 → 1 → 0: reduced y-damping increases y-amplitude;
     the lobes widen in the x-y plane.
7. **Switch to Material Preview** (Z → Material Preview or `Alt+Z`):
   confirm cobalt (slow orbit near fixed-point vicinities) → amber (fast
   free-flight arcs between the lobes) across the ChenLee_Speed gradient.
8. **Open Spreadsheet editor** — select `ChenLee_Speed` attribute:
   verify FLOAT_COLOR values span 0–1 across all vertices.
9. **Run `record.py`** — OpenGL render fires 240 frames (~10 s at 24 fps)
   cycling through Basis → SK_LowA → SK_HighC → Basis.
10. **End recording.**

## Viewport shading hints

- **Material Preview** (Shift+Z) with HDRI lighting disabled gives the
  cleanest cobalt–amber emission gradient against a dark background.
- Numpad 5 (orthographic) and Numpad 1/3/7 give clean axis-aligned views
  that show the Z₂×Z₂ symmetry of the four off-origin fixed points clearly.
- For the diagonal view that best shows the rigid-body character: rotate to
  approx. 30° elevation, 45° azimuth — the twin figure-eights appear nested.
