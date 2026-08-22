# Screen Recording Notes — Ocean Modifier Fourier Sea

## Software
- **OBS Studio ≥ 30.0** or **Windows Game Bar** (Win+G → Record)
- Source type: **Window Capture** → Blender 5.1

## Settings
| Setting | Value |
|---|---|
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no mic, no desktop audio) |
| Output | `public/library/videos/modifiers/modifier-ocean-fourier-water-shader/screen.mp4` |
| Encoding | H.264, CRF 20 (or OBS "High Quality" preset) |

## Scene to record (target: 90–120 seconds)

1. **Start recording** before opening the file.
2. Open `ocean_surface.blend` (or run `blueprint.py` from the Scripting workspace).
3. In the 3D Viewport, switch to **Material Preview** (Z → Material Preview).
4. Zoom out to see the full ocean tile.  Note the foam streaks at wave crests.
5. Press **Space** to start animation playback.
6. While playing, **orbit slowly** (middle-mouse drag) to show how the wave
   direction and foam crests are aligned with the wind vector.
7. Press **Space** to pause.  Open **Modifier Properties** (wrench icon) on the
   ocean plane.  Expand the **Ocean** modifier.  Point out:
   - Spectrum = MAXJORNER
   - Wind Velocity = 28 m/s
   - Choppiness = 1.5
   - Foam Layer = `foam` (ticked)
   - Time = currently driven (the field should show the animated value)
8. Press Space again to resume.  Open the **Shader Editor** (bottom strip).
   Hover over the **Attribute** node to show `foam` as the attribute name.
   Show the Mix Shader — foam mask blends water BSDF with white Emission.
9. Stop playback.  Switch to **Rendered** view (Z → Rendered).
   Orbit slowly to show EEVEE Next SSR reflections and foam emission.
10. **Stop recording.**

## Post-trim (optional)
```bash
ffmpeg -i screen.mp4 -ss 0.5 -to 115.0 -c copy screen_trimmed.mp4
```
