# Screen Recording Notes — FCurve Modifier Poi Tutorial

Capture `screen.mp4` alongside the rendered `viewport.mp4` to give viewers a
full-context tutorial video: code running, Graph Editor showing modifier stacks,
and the 3D viewport playing back the result.

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled |
| Output format | MP4 (H.264, CRF 23) |
| Output file | `screen.mp4` — place in this directory |

## Recording flow

1. Open Blender 5.1 — **Scripting** workspace.
2. Load `blueprint.py` in the text editor panel.
3. Split the viewport so the **Graph Editor** is visible alongside the 3D view.
4. **Start OBS recording.**
5. Press **Alt+P** (or the Run Script button) to execute the script.
6. Once the script finishes, switch to the **Graph Editor**.
7. Select `HF_Poi_A` — expand the location channels and show the modifier icons
   in the sidebar (N panel → Modifiers tab).  The NOISE and CYCLES modifiers
   appear as coloured overlays on the curve.
8. Select `HF_Poi_B` — show the STEPPED staircase overlay on the Y location
   channel, and the GENERATOR flat line on Z.
9. Switch back to the **3D Viewport**.  Press **Space** to play the timeline.
   Let at least two full loops play (≈ 6 s) so both balls are clearly visible.
10. **Stop OBS recording** and save as `screen.mp4` in this directory.

## What to capture (checklist)

- [ ] Script text visible in the editor while it runs
- [ ] 3D viewport: both poi balls animating (cyan = smooth flutter, amber = stepping)
- [ ] Graph Editor with Ball A selected — NOISE + CYCLES modifier stack visible
- [ ] Graph Editor with Ball B selected — STEPPED overlay on Y, GENERATOR on Z
- [ ] Timeline playback: a minimum of two full orbit cycles
