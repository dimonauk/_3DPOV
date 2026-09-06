# Screen Recording Notes — Sprott J Attractor

## Target file
`public/library/videos/scripting/python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

## Setup
1. Open Blender 5.1 → New → General.
2. Open the Text Editor pane (Shift+F11).
3. Load `blueprint.py` and press **Run Script** (Alt+P). Wait ~45 s for integration.
4. Verify the SprottJ_Tube object exists in the Outliner with 4 shape keys.
5. Switch the viewport shading to **Material Preview** (Z → Material Preview).
   The cobalt-to-amber gradient should be visible on the tube.

## OBS / Windows Game Bar settings
| Setting | Value |
|---|---|
| Window source | Blender (main window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Output path | (see Target file above) |

## What to record (~90 seconds)
1. **0–15 s** — Show the viewport at rest, rotating slowly with MMB. Point at the tube shape.
2. **15–35 s** — Open the Properties panel (N) → Object Data → Shape Keys. Slide **SK_LoB** value from 0 → 1. Orbit becomes visibly more elongated and nearly-periodic.
3. **35–55 s** — Drag SK_LoB back to 0. Slide **SK_HiB** to 1. Wider y-excursions — orbit broadens.
4. **55–75 s** — Drag SK_HiB back to 0. Slide **SK_VHiB** to 1. Dominant quadratic fold — topology shift visible.
5. **75–90 s** — Reset all keys to 0 (Basis). Zoom out, pause on the full attractor.

## Running record.py for the viewport.mp4
After blueprint.py finishes, load `record.py` in the Text Editor and press Alt+P.
Output goes to the `videos/` path automatically. Render takes ~3 min on a mid-range GPU.
