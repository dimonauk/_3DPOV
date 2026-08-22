# Screen Recording Notes — Haar DWT Poi Curvature Ribbon

Target file: `public/library/videos/scripting/python-numpy-haar-dwt-poi-curvature-ribbon/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic / no system audio needed) |
| Output format | MP4 / H.264, CRF 18 |

## Recording flow (~5 minutes total)

1. **0:00 — Open scene** — Blender 5.1, File → New → General.
2. **0:10 — Scripting workspace** — click the Scripting tab in the top header.
3. **0:15 — Paste blueprint.py** — New, paste, show parameters block briefly.
4. **0:30 — Run script** — press Alt+P. Show System Console (`Window → Toggle System Console`) with band-length printout.
5. **0:55 — Inspect 3D Viewport** — tumble to show all four bands. Press Z → Material Preview so emission colours are visible.
6. **1:20 — Identify bands** — hover each ribbon in order: white (slow approximation), cerulean (coarse detail), jade (medium detail), rose (fine detail).
7. **2:00 — Show bevel variation** — rotate so the variation in ribbon thickness is clearly visible — thicker sections = high curvature in that frequency band.
8. **2:30 — Vary PERTURB_AMP** — change 0.35 → 0.70, re-run, show how all detail bands widen while approximation changes shape.
9. **3:15 — Vary J** — change J = 3 → J = 4, re-run, show the extra d4 band (orange/amber).
10. **4:00 — Run record.py** — paste and run, show render progress in terminal.
11. **4:45 — Stop recording.**

## Tips

- Maximise the Blender window before starting OBS capture.
- Use the Numpad keys for orthographic views during the band-inspection section.
- Press N in the 3D Viewport to open the side panel; if the Item tab shows the active curve's bevel_depth, keep it visible.
