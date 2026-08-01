# Screen Recording Notes — CVT Faceted Poi Head

OBS / Game Bar capture instructions for `screen.mp4`.

## Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output | MP4 / H.264 / CRF 23 |

## What to record

1. **Open Blender 5.1** — new General file.
2. Open the **Scripting** workspace (top header tab).
3. In the Text Editor, click *Open* → navigate to `blueprint.py` → click *Open*.
4. Press **Run Script** (▶ or Alt+P).
   - Watch the System Console (Window → Toggle System Console on Windows) for Lloyd iteration progress.
   - The faceted sphere appears in the viewport after ~10–20 seconds.
5. Switch to **Material Preview** (Z → Material Preview) — bloom-lit facets visible.
6. Orbit around the object with **Middle Mouse** to show facet detail.
7. Switch to **Rendered** (Z → Rendered) for full EEVEE Next bloom pass.
8. Open `record.py` in the Text Editor → **Run Script**.
   - This renders a 6-second MP4 to `public/library/videos/…/viewport.mp4`.
   - Progress shown in the render window.
9. Stop recording once the render completes and the viewport returns to normal.

## Suggested takes

| Take | Duration | What to show |
|---|---|---|
| A — Lloyd convergence | 30 s | Script run, console iteration log, sphere materialising |
| B — Facet detail | 20 s | Orbit close-up of grout lines and emission colours |
| C — Render | 10 s | Animated 360° rotation render preview |

## Notes

- The Lloyd iterations print to the **System Console**, not the Info header — open it before running for a satisfying progress readout.
- If scipy is not installed in Blender's Python, open a terminal and run:
  ```
  <blender-python> -m pip install scipy
  ```
  where `<blender-python>` is `blender-path/python/bin/python3.xx`.
- Bloom requires **EEVEE Next** render engine (Blender 4.2+, default in 5.1).
