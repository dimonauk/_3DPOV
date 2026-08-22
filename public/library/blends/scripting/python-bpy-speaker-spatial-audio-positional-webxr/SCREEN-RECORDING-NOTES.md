# Screen Recording Notes — Speaker Spatial Audio Tutorial

## Software

- **OBS Studio** (or Windows Game Bar `Win+G`) — audio track OFF
- Target: `public/library/videos/scripting/python-bpy-speaker-spatial-audio-positional-webxr/screen.mp4`

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264, CRF 18 |
| Audio | **Disabled** (no mic, no desktop audio) |

## What to capture

1. **Open Blender 5.1** — New General file.
2. Switch to the **Scripting workspace**. Open `blueprint.py`.
3. Start OBS recording.
4. **Run Script** → show the three speaker cone gizmos appearing in the viewport.
5. Switch to the **3D viewport** — press `Numpad 0` for camera view.
6. Play the animation (`Space`) to show the orbit speaker circling.
7. Open the System Console (Window → Toggle System Console) — scroll to show the
   exported JSON path and GLB path.
8. Open `speakers_manifest.json` in a text editor alongside Blender to show the
   baked position data.
9. Stop OBS recording. Trim to ≤ 90 seconds.
10. Export as `screen.mp4` (H.264, yuv420p) to the target path above.

## Viewport state before recording

- Overlay: **Speaker cone gizmos ON** (Overlays → Geometry → Speaker Cone)
- Shading: **Solid** (Shift+Z) with Cavity ON for clear speaker object visibility
- Show all three speakers simultaneously — zoom/pan to frame all three
- Timeline visible at the bottom — scrub to show orbit animation before recording
