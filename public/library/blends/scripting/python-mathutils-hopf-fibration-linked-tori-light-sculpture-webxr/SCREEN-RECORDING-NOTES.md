# Screen Recording Notes — Hopf Fibration Tutorial

**Target output:** `public/library/videos/scripting/python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr/screen.mp4`

## OBS Studio setup

| Setting | Value |
|---------|-------|
| Scene source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264) |
| Bitrate | 6 000 kbps (CRF 18) |
| Audio | Disabled (no mic, no system audio) |

## Recording flow

1. **Start recording** in OBS before opening Blender.
2. Open Blender 5.1. Create a new file. Switch to the **Scripting** workspace.
3. Open `blueprint.py` via the text editor header → Open → navigate to the library directory.
4. Scroll slowly through the script so viewers can read the parameter block and the main functions.
   Pause 3 s on the `fibonacci_sphere` function and 4 s on `hopf_fibre_projected` — these are the core.
5. Press ▶ **Run Script**. Keep the camera on the Console output while it prints:
   `[HF] Hopf fibration: N base points sampled on S²`  and  `[HF] N fibres → …/hf_hopf_fibration.glb`
6. Switch to the **Layout** workspace. Orbit the viewport with middle-mouse to show the sculpture from
   several angles (top, front-side, 3/4 view). Zoom in on the interlocked circles. Pause 5 s.
7. Switch back to **Scripting** and open `record.py`. Press ▶ **Run Script**.
   Keep the recording running while viewport.mp4 renders — the progress bar in the bottom timeline
   is visible in the window.
8. **Stop recording** in OBS after viewport.mp4 finishes.

## Post-processing (DaVinci Resolve / kdenlive)

- Trim the recording to the scripting flow only (start at step 3, end after step 7).
- Add a title card at the start:
  - Title: **Hopf Fibration — S³→S² Bundle Projection**
  - Subtitle: **Blender 5.1 Python mathutils · Holoflow Studio**
- Colour grade: slight desaturate + contrast increase so the glowing fibres pop.
- Export at 1920 × 1080, 30 fps, H.264, CRF 20.
- Save to `public/library/videos/scripting/python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr/screen.mp4`

## Windows Game Bar (alternative)

Press **Win + G** → enable capture → **Win + Alt + R** to start/stop.
Check Settings → Captures → set resolution to 1080p. Audio recording must be disabled manually
(Settings → Captures → uncheck "Record audio when I record a game").
