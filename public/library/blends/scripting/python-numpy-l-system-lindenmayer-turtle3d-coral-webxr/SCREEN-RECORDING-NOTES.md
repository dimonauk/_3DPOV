# Screen Recording Notes — L-System Coral

Target file: `public/library/videos/scripting/python-numpy-l-system-lindenmayer-turtle3d-coral-webxr/screen.mp4`

## OBS / Game Bar Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture — Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Format | MP4 / H.264 |
| Bitrate | 8 000 kbps (CBR) |

## Session Script

1. **Open Blender 5.1** — default startup scene (delete the cube manually or leave it; blueprint.py clears everything)
2. Switch to **Scripting** workspace (top header tab)
3. Click **Open** in the Text Editor and navigate to `blueprint.py`
4. **Start recording** (OBS: Start Recording / Win: Win+Alt+R)
5. Press **Run Script** (▷ or Alt+P) — watch the coral build in the viewport
6. Switch to **3D Viewport** — orbit around the coral with Middle Mouse to show its 3D depth
7. Open `record.py` in the Text Editor, run it — shows the grow animation
8. Press **Spacebar** in the viewport to play the animation (Z-scale 0 → 1 grow)
9. **Stop recording**

## Viewport Setup Before Recording

- Viewport shading: **Rendered** (EEVEE) — shows the emission glow
- Colour space: Filmic, High Contrast look
- World background: black (set via World Properties → Surface → Strength = 0)
- Enable **Bloom** in Render Properties → EEVEE → Bloom (threshold 0.5, intensity 0.6)

## Notes

- The coral has 121 tube segments at GENERATIONS=5; viewport should be smooth.
- Orbit the camera to show that branches spread in X, Y, and Z — the `+`, `&`, `^` turtle symbols each use a different rotation axis.
- If the emission looks too bright, reduce EMIT_STR to 2.0 in blueprint.py and re-run.
