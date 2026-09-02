# Screen Recording Notes — Hyperchaotic Rössler 4D

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
   Integration takes ~15 s; the terminal output shows each shape key being computed.
4. **Switch to Layout workspace** — select `HC_Rossler_Poi`.
5. **Rotate the viewport slowly** (middle-mouse drag) so the four-scroll topology
   and colour gradient (cobalt inner / amber outer) are visible.
6. **Open the Shape Key panel** (Properties → Object Data → Shape Keys):
   - Scrub `SK_LoD` value 0 → 1 → 0: watch the near-periodic ribbon tighten.
   - Scrub `SK_HiD` value 0 → 1 → 0: watch the 4th-dimension coupling
     produce a second folding layer.
7. **Open the Spreadsheet editor** — select `HC_Rossler_W` attribute:
   confirm float colour values span 0–1 across all vertices.
8. **Run `record.py`** — OpenGL render fires (240 frames, ~20 s).
9. **End recording.**

## Viewport shading hints

- Use **Material Preview** (Z → Material Preview) to see the cobalt–amber gradient.
- Turn on **Cavity (Screen Space)** in viewport overlay to accentuate the tube
  cross-section folds.
- Camera suggested position: distance ≈ 35 m, elevation ≈ 25°, orbit around Z.

## Trim guidance

Keep at least 5 s of the shape-key scrub for the final cut.
`screen.mp4` + `viewport.mp4` → concatenate with FFmpeg for the tutorial video:

```bash
ffmpeg -i screen.mp4 -i viewport.mp4 \
  -filter_complex "[0:v][1:v]hstack=inputs=2" \
  -c:v libx264 -crf 22 tutorial_hc_rossler.mp4
```
