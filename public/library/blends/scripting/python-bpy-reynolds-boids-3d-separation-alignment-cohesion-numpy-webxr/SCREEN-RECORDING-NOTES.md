# Screen Recording Notes — Reynolds 3D Boids

Target file: `screen.mp4`

## Software

OBS Studio (Windows / Mac / Linux) or Windows Game Bar (Win + G → Record)

## Settings

| Setting      | Value                            |
|--------------|----------------------------------|
| Resolution   | 1920 × 1080                      |
| Frame rate   | 30 fps                           |
| Audio        | Off                              |
| Encoder      | H.264 / x264 (software)          |
| Quality (CRF)| 18–22 (high quality)             |

## Window and viewport layout

- Blender maximised full-screen
- 3D Viewport in **Rendered** mode (EEVEE Next) with bloom enabled
- Timeline visible at the bottom (so viewers can see frame counter)
- Properties panel hidden or collapsed to the right

## What to record

1. Open `blueprint.py` in the Blender Text Editor
2. Click **Run Script** — the console should print "[boids] Simulation complete"
3. In the 3D Viewport, press **Numpad 0** to enter Camera view
4. Press **Space** to play — observe:
   - Frames 1–40: random scattering, each agent moving independently
   - Frames 40–100: local clusters forming, short aligned streams appear
   - Frames 100–180: stable sub-flocks cruise the box, briefly merging and splitting
5. Let it loop once; scrub back manually to frame 1 for a second loop
6. Stop OBS after the second loop completes

## OBS source

- Source type: **Window Capture → Blender**
- Crop: none (capture the full window)

## Output path

```
public/library/videos/scripting/
  python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr/
    screen.mp4
```
