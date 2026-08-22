# Screen Recording Notes — Thomas Attractor Poi Trails

Target file: `public/library/videos/scripting/python-scipy-thomas-.../screen.mp4`

## Software

OBS Studio 30+ or Windows Game Bar (Win+G). OBS preferred for stable bitrate.

## OBS Settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no voiceover for library asset) |
| Output format | MP4 / H.264 |
| CRF | 18 (high quality) |

## What to record

1. **Blueprint run** (2–3 min): Open Blender → Scripting workspace → paste/open
   `blueprint.py` → click Run Script. Show the three poi tubes appearing in the
   viewport as the script executes. Keep the Info header visible so the export
   print statement is readable.

2. **Viewport inspection** (1–2 min): Switch to Material Preview (Z key → Material
   Preview). Tumble around the three interlocked attractor trails — pause on the
   characteristic figure-8 lobes. Enable Rendered preview briefly to see emission
   glow. Show the Object Properties → Materials panel for each tube.

3. **Parameter variation** (1 min, optional): In the script, change `B = 0.208`
   to `B = 0.19` and re-run. Show how the trajectory escapes the bounded attractor
   and wanders further — the labyrinth chaos mode. Then restore B=0.208.

## Duration target

6–10 minutes total. Edit out waiting time between script start and completion.

## Viewport shading for recording

- Header bar: Shading → Material Preview (solid background hidden)
- Overlays: turn off grid overlay for clean black background
- Camera: Numpad 0 for camera view; or free-tumble for exploratory recording

## File naming

Export as: `screen.mp4` in the same folder as this file, then move to:
`public/library/videos/scripting/python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr/screen.mp4`
