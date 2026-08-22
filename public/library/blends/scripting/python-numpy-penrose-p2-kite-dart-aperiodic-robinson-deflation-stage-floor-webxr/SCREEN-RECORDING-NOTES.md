# Screen-Recording Notes — Penrose P2 Kite-Dart Stage Floor

Use these instructions to capture `screen.mp4` alongside the rendered `viewport.mp4`.

## Software
- **OBS Studio** (recommended) or Windows Game Bar (Win + G).

## OBS Setup
1. **Source**: Window Capture → select the Blender 5.1 window.
2. **Canvas**: 1920 × 1080. Output scaled to 1920 × 1080.
3. **Output** → Recording:
   - Format: MP4 / MKV
   - Encoder: x264 (CRF 18) or NVENC H.264
4. **Audio**: disable all audio tracks (mute microphone and desktop capture).
5. **Filename**: `screen.mp4` → save into
   `public/library/videos/scripting/python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr/`

## What to Record
1. Open Blender 5.1. Set workspace to **Scripting** tab.
2. Load `blueprint.py` into the text editor; scroll through the code slowly
   so the deflation function and pairing logic are readable on screen.
3. Press **Run Script** (Alt + P). The console prints the kite/dart count
   and the ratio ≈ φ. Show this output.
4. Switch to **3D Viewport** in **Material Preview** shading.
   Orbit around the tiling: overhead → 25° elevation → orbit 360°.
5. With the floor selected, open the **Item properties** panel (N) and show
   the custom `holoflow:facet` and `holoflow:category` properties.
6. Switch to **Scripting** tab, load `record.py`, run it to set camera
   keyframes. Switch to **Timeline** and scrub through to show the path.
7. End with the **Viewport** in Rendered (EEVEE Next) shading and let it
   denoise for a few seconds showing the final floor appearance.

## Duration
Target 4–6 minutes. The viewer should clearly see:
- The Robinson triangle deflation producing a dense tile field.
- The amber kites vs crimson dart colour scheme.
- The five-fold approximate symmetry of the tiling visible from overhead.
- The tile count console output (kite/dart ratio ≈ 1.618).

## Trim
Trim any dead time between script runs. Keep the code-scrolling segments
at a reading pace (≈ 1 line / second).
